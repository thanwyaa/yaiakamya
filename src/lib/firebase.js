import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  increment,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Auth Functions
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', result.user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: result.user.uid,
      name: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      coins: 100,
      role: 'student',
      createdAt: serverTimestamp(),
      isBlocked: false,
      totalWatchTime: 0,
      quizzesCompleted: 0
    });
  }
  return result;
};

export const signInWithEmail = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email, password, name) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    name: name,
    email: email,
    coins: 100,
    role: 'student',
    createdAt: serverTimestamp(),
    isBlocked: false,
    totalWatchTime: 0,
    quizzesCompleted: 0
  });
  return result;
};

export const logoutUser = () => signOut(auth);

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Lectures Functions
export const getLectures = async () => {
  const q = query(collection(db, 'lectures'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getLectureById = async (id) => {
  const docRef = doc(db, 'lectures', id);
  const docSnap = await getDoc(docRef);
  return { id: docSnap.id, ...docSnap.data() };
};

export const addLecture = async (lectureData) => {
  return await addDoc(collection(db, 'lectures'), {
    ...lectureData,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateLecture = async (id, data) => {
  return await updateDoc(doc(db, 'lectures', id), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteLecture = async (id) => {
  return await deleteDoc(doc(db, 'lectures', id));
};

export const incrementLectureViews = async (id) => {
  return await updateDoc(doc(db, 'lectures', id), {
    views: increment(1)
  });
};

// User Progress Functions
export const updateUserProgress = async (userId, lectureId, watchTime, isCompleted = false) => {
  const progressRef = doc(db, 'progress', `${userId}_${lectureId}`);
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) {
    await setDoc(progressRef, {
      userId,
      lectureId,
      watchTime,
      isCompleted,
      lastWatched: serverTimestamp()
    });
  } else {
    await updateDoc(progressRef, {
      watchTime,
      isCompleted: isCompleted || progressSnap.data().isCompleted,
      lastWatched: serverTimestamp()
    });
  }
  
  if (isCompleted) {
    await addCoins(userId, 50);
  }
};

// Coins System
export const addCoins = async (userId, amount, reason = '') => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    coins: increment(amount)
  });
  
  await addDoc(collection(db, 'coins_transactions'), {
    userId,
    amount,
    reason,
    timestamp: serverTimestamp()
  });
};

// Quizzes System
export const getQuizzes = async () => {
  const snapshot = await getDocs(collection(db, 'quizzes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getQuizById = async (id) => {
  const docRef = doc(db, 'quizzes', id);
  const docSnap = await getDoc(docRef);
  return { id: docSnap.id, ...docSnap.data() };
};

export const submitQuizResult = async (userId, quizId, score, totalQuestions) => {
  const quizResultRef = doc(db, 'quiz_results', `${userId}_${quizId}`);
  const isPassed = (score / totalQuestions) >= 0.7;
  
  await setDoc(quizResultRef, {
    userId,
    quizId,
    score,
    totalQuestions,
    percentage: (score / totalQuestions) * 100,
    isPassed,
    completedAt: serverTimestamp()
  });
  
  if (isPassed) {
    const coinsEarned = Math.floor((score / totalQuestions) * 100);
    await addCoins(userId, coinsEarned, `Completed quiz: ${quizId}`);
  }
  
  await updateDoc(doc(db, 'users', userId), {
    quizzesCompleted: increment(1)
  });
  
  return isPassed;
};

// Leaderboard Real-time
export const subscribeToLeaderboard = (callback) => {
  const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('coins', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const leaders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(leaders);
  });
};

// Admin Functions
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const toggleBlockUser = async (userId, isBlocked) => {
  await updateDoc(doc(db, 'users', userId), { isBlocked });
};

export const updateUserCoins = async (userId, coins) => {
  await updateDoc(doc(db, 'users', userId), { coins });
};

export const addQuiz = async (quizData) => {
  return await addDoc(collection(db, 'quizzes'), {
    ...quizData,
    createdAt: serverTimestamp()
  });
};

export const deleteQuiz = async (id) => {
  return await deleteDoc(doc(db, 'quizzes', id));
};

// Stats Real-time
export const subscribeToStats = (callback) => {
  const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  const lecturesQuery = collection(db, 'lectures');
  
  const unsubscribe1 = onSnapshot(usersQuery, (snapshot) => {
    const totalStudents = snapshot.size;
    let totalCoins = 0;
    snapshot.forEach(doc => {
      totalCoins += doc.data().coins || 0;
    });
    
    const unsubscribe2 = onSnapshot(lecturesQuery, (lecturesSnap) => {
      callback({
        totalStudents,
        totalLectures: lecturesSnap.size,
        totalCoins,
        averageCoins: totalStudents > 0 ? Math.floor(totalCoins / totalStudents) : 0
      });
    });
    
    return () => unsubscribe2();
  });
  
  return unsubscribe1;
};

export { auth, db, storage };
