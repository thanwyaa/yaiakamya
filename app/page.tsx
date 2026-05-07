'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaVideo, FaTrophy, FaChalkboardTeacher, FaBook, FaQuestionCircle, FaMedal, FaFire, FaStar, FaArrowLeft } from 'react-icons/fa';
import { db, collection, getDocs, query, orderBy, limit, onSnapshot } from '@/lib/firebase';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, lectures: 6, hours: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentLectures, setRecentLectures] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const studentsSnap = await getDocs(collection(db, 'students'));
      let totalHours = 0;
      studentsSnap.forEach(doc => { totalHours += doc.data().totalStudyHours || 0; });
      setStats({ students: studentsSnap.size, lectures: 6, hours: Math.floor(totalHours) });
    };
    loadStats();

    const q = query(collection(db, 'students'), orderBy('chemicalCoins', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students: any[] = [];
      snapshot.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
      setLeaderboard(students);
    });
    return () => unsubscribe();
  }, []);

  const lectures = [
    { id: '1', title: 'الباب الأول - الكيمياء العامة', videoId: 'xDgzehlarWo', views: 342 },
    { id: '2', title: 'الباب الثاني - المحاليل', videoId: 'bLY1TDI9Mm4', views: 289 },
    { id: '3', title: 'الباب الثالث - الحرارة', videoId: 'ywrKtjJmzd4', views: 256 },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30">
              <span className="text-neon-blue text-sm">🧪 منصة تعليمية متكاملة</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="gradient-text">يلا كيمياء</span>
              <br />
              <span className="text-gray-900 dark:text-white">مع مستر زياد مبروك</span>
            </h1>
            <p className="text-xl text-neon-blue mb-2">"الكيمياء بشكل مختلف… فهم + حفظ + حل"</p>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">انضم إلى آلاف الطلاب الذين حققوا التفوق في الكيمياء</p>
            <div className="flex gap-4 justify-center flex-wrap">
              {!user ? (
                <a href="/login" className="btn-primary">ابدأ التعلم الآن</a>
              ) : (
                <a href="/lectures" className="btn-primary">استمر في التعلم</a>
              )}
              <a href="#whyus" className="btn-secondary">اكتشف المنصة</a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              <GlassCard><div className="text-center"><FaUsers className="text-4xl text-neon-blue mx-auto mb-3" /><h3 className="text-3xl font-bold">{stats.students}+</h3><p className="text-gray-500 dark:text-gray-400">طالب مسجل</p></div></GlassCard>
              <GlassCard><div className="text-center"><FaVideo className="text-4xl text-neon-purple mx-auto mb-3" /><h3 className="text-3xl font-bold">{stats.lectures}</h3><p className="text-gray-500 dark:text-gray-400">محاضرة</p></div></GlassCard>
              <GlassCard><div className="text-center"><FaTrophy className="text-4xl text-neon-cyan mx-auto mb-3" /><h3 className="text-3xl font-bold">{stats.hours}+</h3><p className="text-gray-500 dark:text-gray-400">ساعة مشاهدة</p></div></GlassCard>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="whyus" className="py-20 px-4 bg-gray-50 dark:bg-dark-400/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">ليه تختار يلا كيمياء؟</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">منصة متكاملة تجمع بين الشرح المتميز والتكنولوجيا الحديثة</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FaBook />, title: 'شرح بسيط', desc: 'شرح مبسط ومباشر لكل جزئية في المنهج' },
              { icon: <FaChalkboardTeacher />, title: 'محاضرات منظمة', desc: 'تقسيم منهجي حسب الأبواب والموضوعات' },
              { icon: <FaQuestionCircle />, title: 'كويزات تفاعلية', desc: 'اختبارات بعد كل محاضرة لقياس الفهم' },
              { icon: <FaMedal />, title: 'نظام نقاط', desc: 'عملات كيميائية تحفزك على المذاكرة' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center hover:scale-105">
                <div className="text-3xl text-neon-blue mb-3 flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0">
              <img src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" className="w-48 h-48 rounded-full object-cover border-4 border-neon-blue" />
            </div>
            <div className="text-center md:text-right">
              <h3 className="text-2xl font-bold gradient-text mb-2">مستر زياد مبروك</h3>
              <p className="text-neon-blue mb-4">خبير تدريس الكيمياء - ثانوية عامة</p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">خبرة أكثر من 10 سنوات في تدريس الكيمياء، ساعد آلاف الطلاب على تحقيق التفوق والنجاح. يتميز بأسلوبه المبسط والمبتكر في شرح المنهج وتوصيل المعلومة.</p>
              <div className="flex gap-4 justify-center md:justify-start">
                <span className="px-3 py-1 bg-neon-blue/10 rounded-full text-neon-blue text-sm">🏆 10+ سنوات خبرة</span>
                <span className="px-3 py-1 bg-neon-purple/10 rounded-full text-neon-purple text-sm">👨‍🏫 5000+ طالب</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Lectures */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-dark-400/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">📚 آخر المحاضرات</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">أحدث المحاضرات المضافة إلى المنصة</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lectures.map((lecture, i) => (
              <GlassCard key={i}>
                <img src={`https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`} className="w-full h-48 object-cover rounded-lg mb-4" />
                <h3 className="text-xl font-bold mb-2">{lecture.title}</h3>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
                  <span><FaVideo className="inline ml-1" /> {lecture.views} مشاهدة</span>
                  <a href={`/lecture/${lecture.id}`} className="text-neon-blue hover:text-neon-purple">مشاهدة →</a>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text">🏆 أفضل الطلاب</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">المتصدرون في العملات الكيميائية</p>
          <div className="max-w-3xl mx-auto glass-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20"><tr><th className="p-4 text-right">#</th><th className="p-4 text-right">الطالب</th><th className="p-4 text-right">🧪 العملات</th><th className="p-4 text-right">🔥 الستريك</th></tr></thead>
              <tbody>
                {leaderboard.map((s, idx) => (
                  <tr key={s.id} className="border-b border-white/10"><td className="p-4">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</td><td className="p-4">{s.displayName}</td><td className="p-4 text-neon-blue font-bold">{s.chemicalCoins || 0} 🧪</td><td className="p-4"><FaFire className="inline text-orange-500 ml-1" /> {s.currentStreak || 0}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-neon-blue/10">
        <div className="container mx-auto text-center">
          <GlassCard className="max-w-3xl mx-auto p-12"><h2 className="text-3xl font-bold mb-4 gradient-text">جهز نفسك للامتحان النهائي</h2><p className="mb-6">انضم إلى آلاف الطلاب الذين حققوا التفوق في الكيمياء مع مستر زياد مبروك</p>{!user ? <a href="/login" className="btn-primary">سجل الآن وابدأ الرحلة</a> : <a href="/lectures" className="btn-primary">استمر في التعلم</a>}</GlassCard>
        </div>
      </section>
    </div>
  );
}
