'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfilePage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [userStats, setUserStats] = useState({
    totalWatchTime: 0,
    quizzesCompleted: 0,
    totalCoins: 0,
    rank: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !isGuest) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Get user progress
      const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.uid));
      const progressSnap = await getDocs(progressQuery);
      const totalWatch = progressSnap.docs.reduce((sum, doc) => sum + (doc.data().watchTime || 0), 0);
      
      // Get user rank
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('coins', 'desc'));
      const usersSnap = await getDocs(usersQuery);
      let rank = 1;
      usersSnap.forEach((doc, idx) => {
        if (doc.id === user.uid) rank = idx + 1;
      });
      
      // Get transactions
      const transactionsQuery = query(
        collection(db, 'coins_transactions'), 
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      
      setUserStats({
        totalWatchTime: totalWatch,
        quizzesCompleted: user.quizzesCompleted || 0,
        totalCoins: user.coins || 0,
        rank: rank
      });
      
      setRecentActivity(transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'الأسبوع 1', coins: 100, quizzes: 2 },
    { name: 'الأسبوع 2', coins: 250, quizzes: 4 },
    { name: 'الأسبوع 3', coins: 400, quizzes: 6 },
    { name: 'الأسبوع 4', coins: user?.coins || 0, quizzes: user?.quizzesCompleted || 8 }
  ];

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">وضع الضيف</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            أنت الآن في وضع التصفح. سجل دخولك لمشاهدة ملفك الشخصي وتتبع تقدمك.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                '👨‍🎓'
              )}
            </div>
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-3xl font-bold mb-2">{user?.name || 'الطالب'}</h1>
              <p className="text-white/90">{user?.email}</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-500/20 backdrop-blur rounded-xl px-6 py-3">
                <div className="text-2xl font-bold">🪙 {userStats.totalCoins}</div>
                <div className="text-sm">عملة كيميائية</div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg"
          >
            <div className="text-4xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{Math.floor(userStats.totalWatchTime / 60)}</div>
            <div className="text-gray-600 dark:text-gray-400">ساعة مشاهدة</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg"
          >
            <div className="text-4xl mb-2">📝</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{userStats.quizzesCompleted}</div>
            <div className="text-gray-600 dark:text-gray-400">كويز مكتمل</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg"
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{userStats.rank}</div>
            <div className="text-gray-600 dark:text-gray-400">الترتيب العام</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg"
          >
            <div className="text-4xl mb-2">📚</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{Math.floor(userStats.totalWatchTime / 30)}</div>
            <div className="text-gray-600 dark:text-gray-400">محاضرة مكتملة</div>
          </motion.div>
        </div>
        
        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📈 تقدمك الأسبوعي</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="coins" stroke="#00d4ff" name="العملات" />
                <Line yAxisId="right" type="monotone" dataKey="quizzes" stroke="#7b2cbf" name="الكويزات" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">🕒 آخر النشاطات</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد نشاطات حتى الآن</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white">{activity.reason}</div>
                    <div className="text-sm text-gray-500">
                      {activity.timestamp?.toDate().toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <div className="text-green-500 font-bold">+{activity.amount} 🪙</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
