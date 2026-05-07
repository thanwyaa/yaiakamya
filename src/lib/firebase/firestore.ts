import { db } from './config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';

// Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'moderator' | 'student';
  chemicalCoins: number;
  totalStudyHours: number;
  currentStreak: number;
  longestStreak: number;
  quizzesCompleted: number;
  lecturesWatched: string[];
  createdAt: Date;
  lastActive: Date;
  isBanned: boolean;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Legend';
}

export interface Lecture {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  pdfUrl?: string;
  thumbnail: string;
  duration: number;
  chapter: number;
  order: number;
  views: number;
  totalWatchTime: number;
  createdAt: Date;
  updatedAt: Date;
  isFree: boolean;
  quizId?: string;
}

export interface Quiz {
  id: string;
  lectureId: string;
  title: string;
  questions: QuizQuestion[];
  totalPoints: number;
  attempts: number;
  averageScore: number;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  earnedCoins: number;
  completedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'lecture' | 'quiz' | 'announcement' | 'achievement';
  targetUsers?: string[];
  createdAt: Date;
  readBy: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'watch_lecture' | 'complete_quiz' | 'login' | 'earn_coins' | 'achievement';
  details: any;
  timestamp: Date;
}

// ============ USER OPERATIONS ============

export const createUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    chemicalCoins: 0,
    totalStudyHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    quizzesCompleted: 0,
    lecturesWatched: [],
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    isBanned: false,
    level: 'Bronze',
    role: 'student',
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      lastActive: data.lastActive?.toDate(),
    } as User;
  }
  return null;
};

export const updateUserCoins = async (userId: string, coins: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    chemicalCoins: increment(coins),
    lastActive: serverTimestamp(),
  });
  
  await addActivityLog(userId, 'earn_coins', { coins });
  await updateUserLevel(userId);
};

const updateUserLevel = async (userId: string) => {
  const user = await getUser(userId);
  if (!user) return;
  
  let level: User['level'] = 'Bronze';
  if (user.chemicalCoins >= 10000) level = 'Legend';
  else if (user.chemicalCoins >= 5000) level = 'Diamond';
  else if (user.chemicalCoins >= 2000) level = 'Platinum';
  else if (user.chemicalCoins >= 1000) level = 'Gold';
  else if (user.chemicalCoins >= 500) level = 'Silver';
  
  if (level !== user.level) {
    await updateDoc(doc(db, 'users', userId), { level });
    await addNotification({
      title: '🎉 مستوى جديد!',
      message: `تهانينا! لقد وصلت إلى مستوى ${level}`,
      type: 'achievement',
      targetUsers: [userId],
    });
  }
};

export const updateUserStudyTime = async (userId: string, minutes: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    totalStudyHours: increment(minutes),
    lastActive: serverTimestamp(),
  });
  await updateUserStreak(userId);
};

export const updateUserStreak = async (userId: string) => {
  const user = await getUser(userId);
  if (!user) return;
  
  const lastActive = user.lastActive;
  const today = new Date();
  const lastActiveDate = lastActive instanceof Date ? lastActive : lastActive;
  const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let newStreak = user.currentStreak;
  if (diffDays === 1) {
    newStreak += 1;
    if (newStreak % 7 === 0) {
      await updateUserCoins(userId, 50);
    }
  } else if (diffDays > 1) {
    newStreak = 1;
  }
  
  await updateDoc(doc(db, 'users', userId), {
    currentStreak: newStreak,
    longestStreak: Math.max(user.longestStreak, newStreak),
    lastActive: serverTimestamp(),
  });
};

// ============ LECTURE OPERATIONS ============

export const addLecture = async (lecture: Omit<Lecture, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'totalWatchTime'>) => {
  const lecturesRef = collection(db, 'lectures');
  const newLectureRef = doc(lecturesRef);
  
  await setDoc(newLectureRef, {
    ...lecture,
    id: newLectureRef.id,
    views: 0,
    totalWatchTime: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  await addNotification({
    title: '📚 محاضرة جديدة!',
    message: `تم إضافة محاضرة جديدة: ${lecture.title}`,
    type: 'lecture',
  });
  
  return newLectureRef.id;
};

export const getLectures = async (): Promise<Lecture[]> => {
  const lecturesRef = collection(db, 'lectures');
  const q = query(lecturesRef, orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Lecture));
};

export const getLecture = async (lectureId: string): Promise<Lecture | null> => {
  const lectureRef = doc(db, 'lectures', lectureId);
  const lectureSnap = await getDoc(lectureRef);
  if (lectureSnap.exists()) {
    const data = lectureSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Lecture;
  }
  return null;
};

export const incrementLectureViews = async (lectureId: string, userId: string, watchTime: number) => {
  const lectureRef = doc(db, 'lectures', lectureId);
  await updateDoc(lectureRef, {
    views: increment(1),
    totalWatchTime: increment(watchTime),
  });
  
  const userRef = doc(db, 'users', userId);
  const user = await getUser(userId);
  if (user && !user.lecturesWatched.includes(lectureId)) {
    await updateDoc(userRef, {
      lecturesWatched: arrayUnion(lectureId),
    });
    await updateUserCoins(userId, 10);
    await addActivityLog(userId, 'watch_lecture', { lectureId, watchTime });
  }
  
  await updateUserStreak(userId);
};

// ============ QUIZ OPERATIONS ============

export const addQuiz = async (quiz: Omit<Quiz, 'id' | 'createdAt' | 'attempts' | 'averageScore'>) => {
  const quizzesRef = collection(db, 'quizzes');
  const newQuizRef = doc(quizzesRef);
  
  await setDoc(newQuizRef, {
    ...quiz,
    id: newQuizRef.id,
    attempts: 0,
    averageScore: 0,
    createdAt: serverTimestamp(),
  });
  
  await addNotification({
    title: '📝 كويز جديد!',
    message: `تم إضافة كويز جديد: ${quiz.title}`,
    type: 'quiz',
  });
  
  return newQuizRef.id;
};

export const getQuiz = async (quizId: string): Promise<Quiz | null> => {
  const quizRef = doc(db, 'quizzes', quizId);
  const quizSnap = await getDoc(quizRef);
  if (quizSnap.exists()) {
    const data = quizSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Quiz;
  }
  return null;
};

export const submitQuizAttempt = async (userId: string, quizId: string, score: number, totalPoints: number) => {
  const percentage = (score / totalPoints) * 100;
  const earnedCoins = Math.floor(percentage);
  
  const attemptRef = doc(collection(db, 'quizAttempts'));
  await setDoc(attemptRef, {
    userId,
    quizId,
    score: percentage,
    earnedCoins,
    completedAt: serverTimestamp(),
  });
  
  const quizRef = doc(db, 'quizzes', quizId);
  const quiz = await getDoc(quizRef);
  if (quiz.exists()) {
    const currentAttempts = quiz.data().attempts || 0;
    const currentAvg = quiz.data().averageScore || 0;
    const newAvg = (currentAvg * currentAttempts + percentage) / (currentAttempts + 1);
    await updateDoc(quizRef, {
      attempts: increment(1),
      averageScore: newAvg,
    });
  }
  
  await updateUserCoins(userId, earnedCoins);
  await updateDoc(doc(db, 'users', userId), {
    quizzesCompleted: increment(1),
  });
  await addActivityLog(userId, 'complete_quiz', { quizId, score: percentage, earnedCoins });
  await updateUserStreak(userId);
  
  const user = await getUser(userId);
  if (user && (user.quizzesCompleted) % 5 === 0) {
    await addNotification({
      title: '🏅 إنجاز!',
      message: `أكملت ${user.quizzesCompleted} كويز! أنت مذهل!`,
      type: 'achievement',
      targetUsers: [userId],
    });
  }
  
  return { earnedCoins, percentage };
};

// ============ LEADERBOARD (REAL-TIME) ============

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  chemicalCoins: number;
  studyHours: number;
  streak: number;
  level: string;
  rank: number;
}

export const subscribeToLeaderboard = (callback: (entries: LeaderboardEntry[]) => void) => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('isBanned', '==', false),
    orderBy('chemicalCoins', 'desc'),
    limit(100)
  );
  
  return onSnapshot(q, (snapshot) => {
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    snapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        userId: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        chemicalCoins: data.chemicalCoins || 0,
        studyHours: data.totalStudyHours || 0,
        streak: data.currentStreak || 0,
        level: data.level || 'Bronze',
        rank: rank++,
      });
    });
    callback(entries);
  });
};

// ============ NOTIFICATIONS ============

export const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'readBy'>) => {
  const notifRef = doc(collection(db, 'notifications'));
  await setDoc(notifRef, {
    ...notification,
    id: notifRef.id,
    createdAt: serverTimestamp(),
    readBy: [],
  });
  return notifRef.id;
};

export const subscribeToUserNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const notifRef = collection(db, 'notifications');
  const q = query(
    notifRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const targetUsers = data.targetUsers || [];
      if (targetUsers.length === 0 || targetUsers.includes(userId) || targetUsers.includes('all')) {
        notifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          createdAt: data.createdAt?.toDate(),
          readBy: data.readBy || [],
        });
      }
    });
    callback(notifications);
  });
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, {
    readBy: arrayUnion(userId),
  });
};

// ============ ACTIVITY LOGS ============

export const addActivityLog = async (userId: string, action: ActivityLog['action'], details: any) => {
  const logRef = doc(collection(db, 'activityLogs'));
  await setDoc(logRef, {
    userId,
    action,
    details,
    timestamp: serverTimestamp(),
  });
};

export const subscribeToLiveActivity = (callback: (activities: ActivityLog[]) => void) => {
  const logsRef = collection(db, 'activityLogs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const activities: ActivityLog[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        userId: data.userId,
        action: data.action,
        details: data.details,
        timestamp: data.timestamp?.toDate(),
      });
    });
    callback(activities);
  });
};

// ============ ONLINE USERS TRACKING ============

export const trackUserOnline = (userId: string) => {
  const onlineRef = doc(db, 'onlineUsers', userId);
  
  const setOnline = async () => {
    await setDoc(onlineRef, {
      userId,
      lastSeen: serverTimestamp(),
    });
  };
  
  const setOffline = async () => {
    await deleteDoc(onlineRef);
  };
  
  setOnline();
  window.addEventListener('beforeunload', setOffline);
  
  return () => {
    setOffline();
    window.removeEventListener('beforeunload', setOffline);
  };
};

export const subscribeToOnlineCount = (callback: (count: number) => void) => {
  const onlineRef = collection(db, 'onlineUsers');
  return onSnapshot(onlineRef, (snapshot) => {
    callback(snapshot.size);
  });
};

// ============ ADMIN STATS ============

export const subscribeToAdminStats = (callback: (stats: any) => void) => {
  const usersRef = collection(db, 'users');
  const lecturesRef = collection(db, 'lectures');
  const onlineRef = collection(db, 'onlineUsers');
  
  let totalStudents = 0;
  let totalCoins = 0;
  let totalHours = 0;
  let bannedCount = 0;
  
  const usersUnsub = onSnapshot(usersRef, (snapshot) => {
    totalStudents = snapshot.size;
    totalCoins = 0;
    totalHours = 0;
    bannedCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      totalCoins += data.chemicalCoins || 0;
      totalHours += data.totalStudyHours || 0;
      if (data.isBanned) bannedCount++;
    });
    
    updateStats();
  });
  
  const lecturesUnsub = onSnapshot(lecturesRef, (snapshot) => {
    const topLectures: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      topLectures.push({
        id: doc.id,
        title: data.title,
        views: data.views || 0,
      });
    });
    topLectures.sort((a, b) => b.views - a.views);
    updateStats({ topLectures: topLectures.slice(0, 5) });
  });
  
  const onlineUnsub = onSnapshot(onlineRef, (snapshot) => {
    updateStats({ onlineCount: snapshot.size });
  });
  
  const updateStats = (additional?: any) => {
    callback({
      totalStudents,
      totalCoins,
      totalHours,
      bannedCount,
      onlineCount: 0,
      ...additional,
    });
  };
  
  return () => {
    usersUnsub();
    lecturesUnsub();
    onlineUnsub();
  };
};
