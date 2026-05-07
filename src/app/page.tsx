'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaVideo, FaTrophy, FaFire, FaStar, FaArrowLeft, FaGoogle, FaEnvelope, FaLock, FaUserGraduate, FaChartLine, FaMedal, FaRegClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '@/lib/hooks/useAuth';
import { subscribeToLeaderboard, getLectures, subscribeToOnlineCount } from '@/lib/firebase/firestore';

export default function HomePage() {
  const { user, signInWithGoogle } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [stats] = useState({
    students: 1250,
    hours: 3420,
    success: 94,
  });

  useEffect(() => {
    const unsubLeaderboard = subscribeToLeaderboard(setLeaderboard);
    const unsubOnline = subscribeToOnlineCount(setOnlineCount);
    
    getLectures().then(setLectures);
    
    return () => {
      unsubLeaderboard();
      unsubOnline();
    };
  }, []);

  const features = [
    { icon: <FaUserGraduate className="text-3xl" />, title: 'شرح متكامل', desc: 'منهج كامل بفيديوهات عالية الجودة' },
    { icon: <FaChartLine className="text-3xl" />, title: 'تتبع التقدم', desc: 'نظام متابعة يومي للطلاب' },
    { icon: <FaMedal className="text-3xl" />, title: 'نقاط وجوائز', desc: 'عملات كيميائية وإنجازات' },
    { icon: <FaRegClock className="text-3xl" />, title: 'كويزات وتقييم', desc: 'اختبارات فورية بعد كل محاضرة' },
  ];

  const lecturesData = [
    { title: 'الباب الأول - الكيمياء العامة', views: 342, free: true, url: 'https://youtu.be/xDgzehlarWo' },
    { title: 'الباب الثاني - المحاليل', views: 289, free: true, url: 'https://youtu.be/bLY1TDI9Mm4' },
    { title: 'الباب الثالث - الحرارة', views: 256, free: true, url: 'https://youtu.be/ywrKtjJmzd4' },
    { title: 'المنهج في 3 ساعات', views: 512, free: true, url: 'https://youtu.be/_LeKR7weATE' },
    { title: 'حل كتاب المعهد', views: 198, free: false, url: 'https://youtu.be/O2LJqeoUJoM' },
    { title: 'حل أهم 150 سؤال', views: 423, free: true, url: 'https://youtu.be/LPXRrqsRjRg' },
  ];

  const testimonials = [
    { name: 'أحمد خالد', text: 'والله منصة خرافية! فهمت الكيمياء في أسبوعين بعد ما كانت عقدة', rating: 5, type: 'طالب ثانوية عامة' },
    { name: 'سارة محمود', text: 'أفضل منصة تعليمية جربتها في حياتي، مستر زياد فنان', rating: 5, type: 'طالبة علمي علوم' },
    { name: 'عمر وليد', text: 'الكويزات والتحديات خلتني أذاكر يومياً، العملات الكيميائية حافز رهيب', rating: 5, type: 'طالب ثانوية عامة' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-500 to-dark-400">
      {/* Particle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-neon-blue/20 animate-float-particle"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 10 + 's',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-400/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" 
              alt="يلا كيمياء"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-neon-blue"
            />
            <div>
              <h1 className="text-xl font-bold gradient-text">يلا كيمياء</h1>
              <p className="text-xs text-gray-400">مع مستر زياد مبروك</p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-8">
            <a href="#home" className="hover:text-neon-blue transition-colors">الرئيسية</a>
            <a href="#lectures" className="hover:text-neon-blue transition-colors">المحاضرات</a>
            <a href="#features" className="hover:text-neon-blue transition-colors">المميزات</a>
            <a href="#leaderboard" className="hover:text-neon-blue transition-colors">الترتيب</a>
          </div>
          
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full" />
                <span className="text-sm hidden md:block">{user.displayName}</span>
                <button className="btn-primary text-sm py-2 px-4">لوحة التحكم</button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="btn-primary text-sm py-2 px-4"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-4 min-h-screen flex items-center">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30">
              <span className="text-neon-blue text-sm">🧪 منصة تعليمية متكاملة</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="gradient-text">يلا كيمياء</span>
              <br />
              <span className="text-white">مع مستر زياد مبروك</span>
            </h1>
            <p className="text-xl md:text-2xl text-neon-blue mb-4 font-bold">
              "الكيمياء بشكل مختلف… فهم + حفظ + حل"
            </p>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              انضم إلى آلاف الطلاب الذين حققوا التفوق في الكيمياء مع أقوى منصة تعليمية في مصر
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {!user && (
                <button onClick={() => setShowLogin(true)} className="btn-primary">
                  ابدأ رحلتك الآن مجاناً
                </button>
              )}
              <a href="#lectures" className="btn-secondary">
                استعرض المحاضرات
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
            <div className="glass-card p-6 text-center hover:border-neon-blue/50 transition-all">
              <FaUsers className="text-4xl text-neon-blue mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white">{stats.students}+</h3>
              <p className="text-gray-400">طالب منضم</p>
            </div>
            <div className="glass-card p-6 text-center hover:border-neon-purple/50 transition-all">
              <FaVideo className="text-4xl text-neon-purple mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white">{stats.hours}+</h3>
              <p className="text-gray-400">ساعة محتوى تعليمي</p>
            </div>
            <div className="glass-card p-6 text-center hover:border-neon-cyan/50 transition-all">
              <FaTrophy className="text-4xl text-neon-cyan mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-white">{stats.success}%</h3>
              <p className="text-gray-400">نسبة النجاح</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-dark-400/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">ليه تذاكر مع يلا كيمياء؟</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">منصة متكاملة تجمع بين الشرح المتميز والتكنولوجيا الحديثة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center hover:scale-105 transition-all"
              >
                <div className="text-neon-blue mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lectures Section */}
      <section id="lectures" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 gradient-text">📚 المحاضرات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lecturesData.map((lecture, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card overflow-hidden hover:shadow-[0_0_30px_rgba(0,210,255,0.2)] transition-all"
              >
                <div className="relative">
                  <img 
                    src={`https://img.youtube.com/vi/${lecture.url.split('v=')[1]}/hqdefault.jpg`}
                    alt={lecture.title}
                    className="w-full h-48 object-cover"
                  />
                  {lecture.free && (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 text-white text-xs rounded-full">مجاني</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">{lecture.title}</h3>
                  <div className="flex justify-between items-center text-gray-400 text-sm mb-4">
                    <span><FaVideo className="inline ml-1 text-neon-blue" /> {lecture.views} مشاهدة</span>
                    <span>⏱️ {Math.floor(Math.random() * 60) + 30} دقيقة</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={lecture.url} target="_blank" className="flex-1 btn-primary text-center text-sm py-2">
                      مشاهدة
                    </a>
                    {lecture.title.includes('الباب') && (
                      <button className="btn-secondary text-sm py-2 px-3">
                        📄 PDF
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-20 px-4 bg-dark-400/50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold gradient-text">🏆 ترتيب الطلاب</h2>
              <p className="text-gray-400 mt-2">متجدد بشكل لحظي - 🧪 العملات الكيميائية</p>
            </div>
            <div className="glass-card px-4 py-2">
              <span className="text-neon-blue">🟢 {onlineCount} متصل الآن</span>
            </div>
          </div>
          
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-right">#</th>
                    <th className="p-4 text-right">الطالب</th>
                    <th className="p-4 text-right">🧪 العملات</th>
                    <th className="p-4 text-right">📚 الساعات</th>
                    <th className="p-4 text-right">🔥 الستريك</th>
                    <th className="p-4 text-right">🏅 المستوى</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 10).map((entry: any, index) => (
                    <tr key={entry.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">
                        {entry.rank === 1 && '🥇'}
                        {entry.rank === 2 && '🥈'}
                        {entry.rank === 3 && '🥉'}
                        {entry.rank > 3 && `#${entry.rank}`}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {entry.photoURL && <img src={entry.photoURL} className="w-8 h-8 rounded-full" />}
                          <span>{entry.displayName}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-neon-blue">{entry.chemicalCoins} 🧪</td>
                      <td className="p-4">{Math.floor(entry.studyHours / 60)} ساعة</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1">
                          <FaFire className="text-orange-500" /> {entry.streak}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.level === 'Legend' ? 'bg-purple-500/20 text-purple-500' :
                          entry.level === 'Diamond' ? 'bg-cyan-500/20 text-cyan-500' :
                          entry.level === 'Platinum' ? 'bg-blue-500/20 text-blue-500' :
                          entry.level === 'Gold' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {entry.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {!user && (
            <div className="text-center mt-8">
              <p className="text-gray-400 mb-4">سجل الدخول لترى ترتيبك وتنافس الطلاب الآخرين!</p>
              <button onClick={() => setShowLogin(true)} className="btn-primary">
                سجل الآن وابدأ المنافسة
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 gradient-text">💬 آراء الطلاب</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-gray-400 text-sm">{testimonial.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="glass-card p-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 gradient-text">جهز نفسك للامتحان النهائي</h2>
            <p className="text-gray-300 mb-6">
              انضم إلى آلاف الطلاب الذين حققوا التفوق في الكيمياء مع مستر زياد مبروك
            </p>
            {!user ? (
              <button onClick={() => setShowLogin(true)} className="btn-primary">
                سجل الآن وابدأ الرحلة
              </button>
            ) : (
              <a href="/dashboard" className="btn-primary">
                اذهب إلى لوحة التحكم
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="glass-card p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <img 
                src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" 
                alt="Logo"
                className="w-16 h-16 rounded-full mx-auto mb-3 ring-2 ring-neon-blue"
              />
              <h2 className="text-2xl font-bold gradient-text">مرحباً بك!</h2>
              <p className="text-gray-400">سجل دخولك لتبدأ رحلة التفوق في الكيمياء</p>
            </div>
            
            <button
              onClick={() => {
                signInWithGoogle();
                setShowLogin(false);
              }}
              className="w-full btn-primary flex items-center justify-center gap-2 mb-4"
            >
              <FaGoogle /> تسجيل الدخول بـ Google
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-400 text-gray-400">أو</span>
              </div>
            </div>
            
            <form className="space-y-4">
              <input type="email" placeholder="البريد الإلكتروني" className="input-primary" />
              <input type="password" placeholder="كلمة المرور" className="input-primary" />
              <button type="submit" className="w-full btn-primary">
                <FaEnvelope className="inline ml-2" /> تسجيل الدخول
              </button>
            </form>
            
            <p className="text-center text-gray-400 text-sm mt-4">
              ليس لديك حساب؟ <button className="text-neon-blue">إنشاء حساب جديد</button>
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-dark-400 border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" className="w-10 h-10 rounded-full" />
                <h3 className="text-xl font-bold gradient-text">يلا كيمياء</h3>
              </div>
              <p className="text-gray-400 text-sm">منصة تعليمية متكاملة لمادة الكيمياء مع مستر زياد مبروك</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#home" className="hover:text-neon-blue">الرئيسية</a></li>
                <li><a href="#lectures" className="hover:text-neon-blue">المحاضرات</a></li>
                <li><a href="#features" className="hover:text-neon-blue">المميزات</a></li>
                <li><a href="#leaderboard" className="hover:text-neon-blue">الترتيب</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="https://t.me/yala_kamya_ziad_mabrok" target="_blank" className="hover:text-neon-blue">📱 Telegram</a></li>
                <li><a href="https://whatsapp.com/channel/0029VbCAgCt5K3zMurVaeF1w" target="_blank" className="hover:text-neon-blue">💬 WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">إحصائيات</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>👥 {stats.students}+ طالب</li>
                <li>📺 {stats.hours}+ ساعة محتوى</li>
                <li>⭐ {stats.success}% نسبة نجاح</li>
                <li>🟢 {onlineCount} متصل الآن</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 يلا كيمياء مع مستر زياد مبروك - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
