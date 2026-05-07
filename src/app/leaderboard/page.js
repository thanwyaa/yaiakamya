'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('coins', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const leadersData = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data()
      }));
      setLeaders(leadersData);
      
      if (user) {
        const userRanking = leadersData.findIndex(l => l.id === user.uid) + 1;
        setUserRank(userRanking > 0 ? userRanking : '100+');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Trophy className="text-yellow-500" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Medal className="text-orange-400" size={24} />;
      default: return <span className="text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500';
      case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default: return 'bg-gradient-to-r from-cyan-500 to-blue-500';
    }
  };

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
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-block"
          >
            <div className="text-6xl mb-4">🏆</div>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            لوحة المتصدرين
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            أفضل الطلاب حسب عدد العملات الكيميائية
          </p>
        </div>

        {/* User's Rank Card */}
        {user && userRank && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="rounded-full" />
                  ) : (
                    '👨‍🎓'
                  )}
                </div>
                <div>
                  <p className="text-sm opacity-90">ترتيبك الحالي</p>
                  <p className="text-3xl font-bold">#{userRank}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90">عملاتك</p>
                <p className="text-3xl font-bold">🪙 {user?.coins || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90">الكويزات المكتملة</p>
                <p className="text-3xl font-bold">📝 {user?.quizzesCompleted || 0}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {leaders.slice(0, 3).map((leader, idx) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`text-center p-6 rounded-2xl shadow-xl ${
                idx === 0 
                  ? 'bg-gradient-to-b from-yellow-500 to-orange-500 scale-105' 
                  : idx === 1 
                  ? 'bg-gradient-to-b from-gray-400 to-gray-500' 
                  : 'bg-gradient-to-b from-orange-400 to-orange-600'
              } text-white`}
            >
              <div className="text-6xl mb-3">
                {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
              </div>
              <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center text-4xl mb-3">
                {leader.photoURL ? (
                  <img src={leader.photoURL} alt={leader.name} className="rounded-full" />
                ) : (
                  '👨‍🎓'
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{leader.name || 'طالب'}</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span>🪙</span>
                <span className="text-2xl font-bold">{leader.coins || 0}</span>
              </div>
              <p className="text-sm opacity-90">📝 {leader.quizzesCompleted || 0} كويز</p>
            </motion.div>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">الطالب</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">العملات</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">الكويزات</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">المشاهدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaders.map((leader, index) => (
                  <motion.tr
                    key={leader.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      user?.uid === leader.id ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(leader.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                          {leader.name?.[0] || 'ط'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{leader.name || 'طالب'}</p>
                          <p className="text-xs text-gray-500">{leader.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>🪙</span>
                        <span className="font-bold text-yellow-500">{leader.coins || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                      {leader.quizzesCompleted || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                      {Math.floor((leader.totalWatchTime || 0) / 60)} ساعة
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action */}
        {user && userRank > 10 && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              أنت على بعد {Math.abs(10 - userRank)} مراكز من المراكز العشرة الأولى!
            </p>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${Math.max(0, 100 - (userRank - 10) * 5)}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
