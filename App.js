import React, { useState, useEffect } from 'react';
import { 
  Play, FileText, Youtube, Instagram, Facebook, 
  Send as Telegram, MessageCircle, Info, 
  ChevronRight, BookOpen, Trophy, 
  X, UserPlus, LogIn, Atom, Video, 
  CheckCircle2, Award, User, Smartphone,
  Zap, Heart, ShieldCheck, Target, 
  ArrowLeft, Laptop, GraduationCap, Layout
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('explanation');
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [completed, setCompleted] = useState([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true);

  // تحميل الإنجاز من الذاكرة
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ziad_chemistry_progress')) || [];
    setCompleted(saved);
  }, []);

  const handleCheck = (id) => {
    const updated = completed.includes(id) 
      ? completed.filter(i => i !== id) 
      : [...completed, id];
    setCompleted(updated);
    localStorage.setItem('ziad_chemistry_progress', JSON.stringify(updated));
  };

  const content = {
    explanation: [
      { id: "exp_1", title: "المحاضرة الأولى: أنواع الروابط والرابطة الآيونية والتساهمية", url: "https://youtu.be/3SQy6j9qdX0" },
      { id: "exp_2", title: "شرح الدرس الثاني: الجزء الأول - نظرية الثمانيات", url: "https://youtu.be/KIdHLm_BtRt" },
      { id: "exp_3", title: "شرح الدرس الثاني: الجزء الثاني - أنواع الروابط والتهجين", url: "https://youtu.be/1JIVypRTUxI" },
      { id: "exp_4", title: "شرح الدرس الثالث: الجزء الأول - نظرية VSEPR", url: "https://youtu.be/u7rTOP0lpak" },
      { id: "exp_5", title: "شرح باقي الدرس الثالث والرابع: الروابط التناسقية والفيزيائية", url: "https://youtu.be/UFOsYtmHuCc" }
    ],
    wafi: [
      { id: "wafi_1", title: "حل كتاب الوافي: الدرس الأول - ج1", url: "https://youtu.be/hh34oRhXBN8" },
      { id: "wafi_2", title: "حل كتاب الوافي: الدرس الأول - ج2", url: "https://youtu.be/gMqM3Uf2mYQ" },
      { id: "wafi_3", title: "حل كتاب الوافي: الدرس الثاني - ج1", url: "https://youtu.be/NGF1Fq1C0Ko" },
      { id: "wafi_4", title: "حل كتاب الوافي: الدرس الثاني - ج2", url: "https://youtu.be/hzWbMiMdzNM" }
    ],
    exam: [
      { id: "exam_1", title: "حل كتاب الامتحان: الدرس الأول - ج1", url: "https://youtu.be/0QY_ZaZ8_40" },
      { id: "exam_2", title: "حل كتاب الامتحان: الدرس الأول - ج2", url: "https://youtu.be/ZgZeeNdcbFE" }
    ],
    revision: [
      { id: "rev_1", title: "مراجعة الباب الأول كاملاً", url: "https://youtu.be/lpgNjh3Xpvw" },
      { id: "rev_2", title: "حل أهم 50 سؤال على الباب الأول", url: "https://youtu.be/9ir3kxBZwCQ" }
    ]
  };

  const socialLinks = [
    { icon: <Youtube />, color: 'bg-red-600', label: 'يوتيوب', link: 'https://youtube.com/...' },
    { icon: <Telegram />, color: 'bg-sky-500', label: 'تليجرام', link: 'https://t.me/...' },
    { icon: <MessageCircle />, color: 'bg-green-600', label: 'واتساب', link: 'https://chat.whatsapp.com/...' }
  ];

  return (
    <div className="min-h-screen bg-[#111d17] font-['Cairo',sans-serif] text-[#e0e7e1] selection:bg-[#c5a02e]/30 overflow-x-hidden" dir="rtl">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-[100] bg-[#0c1611]/95 backdrop-blur-md border-b border-[#c5a02e]/10 px-6">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentPage('home')}>
             <img src="42938.png" className="w-12 h-12 rounded-xl border border-[#c5a02e]/50 shadow-glow animate-pulse" alt="Logo" />
            <div>
              <h1 className="text-xl font-black text-[#c5a02e] tracking-tight">يلا كيمياء</h1>
              <p className="text-[10px] font-bold text-[#e0e7e1]/40 uppercase">مستر زياد مبروك</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10 font-bold text-[#e0e7e1]/60">
            <button onClick={() => setCurrentPage('home')} className={`hover:text-[#c5a02e] transition-colors ${currentPage === 'home' && 'text-[#c5a02e]'}`}>الرئيسية</button>
            <button onClick={() => setCurrentPage('lectures')} className={`hover:text-[#c5a02e] transition-colors ${currentPage === 'lectures' && 'text-[#c5a02e]'}`}>المحاضرات</button>
            <button onClick={() => setCurrentPage('about')} className={`hover:text-[#c5a02e] transition-colors ${currentPage === 'about' && 'text-[#c5a02e]'}`}>لماذا نحن؟</button>
          </div>

          <button onClick={() => setShowAuth(true)} className="bg-[#c5a02e] text-[#111d17] px-7 py-2.5 rounded-full font-black text-sm hover:scale-105 transition-all shadow-lg shadow-[#c5a02e]/10">دخول الطلاب</button>
        </div>
      </nav>

      {/* --- Pages --- */}
      <div className="pt-20">
        {currentPage === 'home' && (
          <section className="relative py-24 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 text-center lg:text-right">
                <div className="inline-flex items-center gap-2 bg-[#c5a02e]/10 text-[#c5a02e] px-5 py-2 rounded-full text-xs font-black border border-[#c5a02e]/20">
                  <Zap size={14} /> رحلة الـ 50 درجة بدأت الآن
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-tight">
                  صمم مستقبل <br/> نجاحك في <span className="text-[#c5a02e]">الكيمياء</span>
                </h2>
                <p className="text-[#a8b3ac] font-bold text-lg max-w-xl leading-relaxed">
                   منصة مستر زياد مبروك ليست مجرد فيديوهات؛ هي تجربة تعليمية فريدة تجعل المادة الأسهل في جدولك الدراسي.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <button onClick={() => setCurrentPage('lectures')} className="bg-[#c5a02e] text-[#111d17] px-10 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 shadow-2xl hover:scale-105 transition-all">
                    ابدأ المذاكرة الآن <ArrowLeft />
                  </button>
                </div>
              </div>
              {/* Box Info */}
              <div className="relative group">
                <div className="relative bg-[#1a2b23] border border-[#c5a02e]/20 rounded-[3rem] p-10 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#0c1611] p-6 rounded-3xl text-center">
                      <Trophy className="text-[#c5a02e] mx-auto mb-2" size={32}/>
                      <h5 className="font-black text-white">إحصائياتك</h5>
                      <p className="text-[10px] text-[#c5a02e]">أنجزت {completed.length} محاضرة</p>
                    </div>
                    <div className="bg-[#0c1611] p-6 rounded-3xl text-center mt-8">
                      <Video className="text-blue-500 mx-auto mb-2" size={32}/>
                      <h5 className="font-black text-white">المحاضرات</h5>
                      <p className="text-[10px] text-blue-400">شرح وحل مفصل</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentPage === 'lectures' && (
          <section className="py-20 px-6 max-w-7xl mx-auto">
             <div className="text-center mb-16 space-y-4">
               <h2 className="text-4xl font-black text-white">مكتبة المحاضرات</h2>
               <div className="w-24 h-1 bg-[#c5a02e] mx-auto rounded-full"></div>
             </div>

             <div className="flex flex-wrap justify-center gap-3 mb-16 bg-[#0c1611] p-3 rounded-[2.5rem] border border-white/5 max-w-3xl mx-auto shadow-2xl">
               {[
                 { id: 'explanation', label: 'الشرح', icon: <Video size={18}/> },
                 { id: 'wafi', label: 'كتاب الوافي', icon: <BookOpen size={18}/> },
                 { id: 'exam', label: 'كتاب الامتحان', icon: <GraduationCap size={18}/> },
                 { id: 'revision', label: 'المراجعات', icon: <Award size={18}/> },
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                   className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-[1.8rem] font-black text-sm transition-all ${
                     activeTab === tab.id ? 'bg-[#c5a02e] text-[#111d17] scale-105' : 'text-[#e0e7e1]/40 hover:text-white'
                   }`}>
                   {tab.icon} {tab.label}
                 </button>
               ))}
             </div>

             <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {content[activeTab].map((item) => (
                   <div key={item.id} className="group bg-[#1a2b23]/50 border border-white/5 hover:border-[#c5a02e]/30 p-6 rounded-[2.5rem] transition-all flex items-center gap-6 shadow-sm hover:shadow-2xl">
                      <button onClick={() => handleCheck(item.id)} 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${completed.includes(item.id) ? 'bg-[#c5a02e] text-[#111d17]' : 'bg-[#0c1611] text-[#c5a02e]/30'}`}>
                        <CheckCircle2 size={24} />
                      </button>
                      <div className="flex-1">
                        <h4 className={`font-black text-sm md:text-md leading-snug transition-all ${completed.includes(item.id) ? 'text-white/30 line-through' : 'text-white'}`}>{item.title}</h4>
                        <div className="flex gap-4 mt-3">
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-[#c5a02e] flex items-center gap-1 uppercase tracking-widest"><Youtube size={14}/> مشاهدة</a>
                        </div>
                      </div>
                   </div>
                ))}
             </div>
          </section>
        )}
      </div>

      {/* --- Install Prompt (تثبيت الموبايل اللي طلبته) --- */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-6 right-6 bg-gradient-to-br from-[#1a2b23] to-[#0c1611] border-2 border-[#c5a02e] rounded-[30px] p-5 z-[1000] flex items-center gap-5 shadow-2xl animate-in slide-in-from-bottom-10">
          <div className="relative w-14 h-24 bg-gray-800 rounded-xl border-4 border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 animate-bounce">
            <div className="absolute top-1 w-6 h-1 bg-gray-700 rounded-full"></div>
            <img src="42938.png" className="w-8 h-8 rounded-full" alt="لوجو" />
            <div className="absolute bottom-1 text-[5px] text-[#c5a02e] font-black">INSTALLING...</div>
          </div>
          <div className="flex-1">
            <h4 className="text-[#c5a02e] font-black text-md mb-1">ثبت المنصة الآن! ⚡</h4>
            <p className="text-white/80 text-[11px] font-medium leading-tight">عشان تتابع منصة مستر زياد مبروك وتوصلك المحاضرات بسرعة، ثبتها على شاشة موبايلك دلوقتي.</p>
            <button className="mt-2 bg-[#c5a02e] text-[#111d17] px-4 py-1.5 rounded-full text-[10px] font-black">إضافة للشاشة الرئيسية</button>
          </div>
          <button onClick={() => setShowInstallPrompt(false)} className="text-white/20 self-start"><X size={20}/></button>
        </div>
      )}

      {/* --- Footer --- */}
      <footer className="mt-20 bg-[#0c1611] border-t border-[#c5a02e]/10 py-16 px-6 text-center">
         <img src="42938.png" className="w-16 h-16 mx-auto mb-6 rounded-2xl grayscale opacity-50" alt="Footer Logo" />
         <p className="text-slate-500 font-bold text-sm">جميع الحقوق محفوظة &copy; 2026 | منصة يلا كيمياء - مستر زياد مبروك</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .shadow-glow { box-shadow: 0 0 20px rgba(197, 160, 46, 0.2); }
        .animate-in { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
