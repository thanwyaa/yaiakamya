// lib/database.js
import { ref, set, get, update, onValue, push, remove, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from './firebase';

// 🎯 **نظام المستخدمين**
export const createUserProfile = async (userId, userData) => {
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, {
    ...userData,
    coins: 0,
    totalWatchTime: 0,
    lastActive: Date.now(),
    createdAt: Date.now(),
    isBlocked: false,
    role: 'student'
  });
};

export const getUserProfile = (userId, callback) => {
  const userRef = ref(database, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    callback(snapshot.val());
  });
};

export const updateUserProfile = async (userId, data) => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, data);
};

// 📚 **نظام المحاضرات**
export const getLectures = (callback) => {
  const lecturesRef = ref(database, 'lectures');
  onValue(lecturesRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.values(data) : []);
  });
};

export const addLecture = async (lectureData) => {
  const lecturesRef = ref(database, 'lectures');
  const newLectureRef = push(lecturesRef);
  await set(newLectureRef, {
    ...lectureData,
    id: newLectureRef.key,
    createdAt: Date.now(),
    views: 0
  });
  return newLectureRef.key;
};

export const incrementViews = async (lectureId) => {
  const lectureRef = ref(database, `lectures/${lectureId}`);
  const snapshot = await get(lectureRef);
  if (snapshot.exists()) {
    const currentViews = snapshot.val().views || 0;
    await update(lectureRef, { views: currentViews + 1 });
  }
};

// 🧪 **نظام العملات الكيميائية**
export const addCoins = async (userId, amount, reason) => {
  const userRef = ref(database, `users/${userId}`);
  const transactionRef = ref(database, `coins_transactions`);
  
  const snapshot = await get(userRef);
  if (snapshot.exists()) {
    const currentCoins = snapshot.val().coins || 0;
    await update(userRef, { coins: currentCoins + amount });
    
    const newTransactionRef = push(transactionRef);
    await set(newTransactionRef, {
      userId,
      amount,
      reason,
      timestamp: Date.now(),
      type: 'earn'
    });
  }
};

// 🧠 **نظام الكويزات**
export const submitQuizResult = async (userId, quizId, score, totalQuestions) => {
  const resultRef = ref(database, `progress/${userId}/quizzes/${quizId}`);
  const percentage = (score / totalQuestions) * 100;
  
  await set(resultRef, {
    score,
    totalQuestions,
    percentage,
    completedAt: Date.now()
  });
  
  // منح عملات بناءً على النتيجة
  const coins = Math.floor(percentage / 10);
  await addCoins(userId, coins, `إكمال كويز بنسبة ${percentage}%`);
};

// 🏆 **لوحة المتصدرين**
export const getLeaderboard = (callback) => {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    if (users) {
      const leaderboard = Object.values(users)
        .filter(user => !user.isBlocked)
        .sort((a, b) => (b.coins || 0) - (a.coins || 0))
        .slice(0, 10);
      callback(leaderboard);
    } else {
      callback([]);
    }
  });
};

// 📊 **الإحصائيات الحية**
export const getLiveStats = (callback) => {
  const statsRef = ref(database, 'stats');
  onValue(statsRef, (snapshot) => {
    callback(snapshot.val() || {
      totalStudents: 0,
      totalLectures: 0,
      totalWatchTime: 0,
      onlineStudents: 0
    });
  });
};

// 🔔 **نظام الإشعارات**
export const sendNotification = async (notification) => {
  const notificationsRef = ref(database, 'notifications');
  const newNotifRef = push(notificationsRef);
  await set(newNotifRef, {
    ...notification,
    createdAt: Date.now(),
    read: false
  });
};

export const getNotifications = (callback) => {
  const notifRef = ref(database, 'notifications');
  const recentQuery = query(notifRef, orderByChild('createdAt'), limitToLast(20));
  onValue(recentQuery, (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.values(data).reverse() : []);
  });
};

// 👑 **صلاحيات الأدمن**
export const checkAdminRole = (userId, callback) => {
  const adminRef = ref(database, `admins/${userId}`);
  onValue(adminRef, (snapshot) => {
    callback(snapshot.exists());
  });
};

export const getAllUsers = (callback) => {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    const users = snapshot.val();
    callback(users ? Object.values(users) : []);
  });
};

export const toggleUserBlock = async (userId, isBlocked) => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, { isBlocked });
};

// 📡 **مراقبة النشاط الحي**
export const logActivity = async (userId, activity) => {
  const activityRef = ref(database, `activities/${userId}`);
  const newActivityRef = push(activityRef);
  await set(newActivityRef, {
    ...activity,
    timestamp: Date.now()
  });
  
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, { 
    lastActive: Date.now(),
    totalWatchTime: activity.watchTime ? increment(activity.watchTime) : undefined
  });
};
