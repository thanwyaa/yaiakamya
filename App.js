const { useState, useEffect } = React;
const { 
  Play, Youtube, Instagram, Facebook, Send, MessageCircle, 
  ChevronRight, BookOpen, Trophy, X, Video, 
  CheckCircle2, Award, Smartphone, Zap, Heart, ShieldCheck, 
  Target, ArrowLeft, Laptop, GraduationCap, Search, Star, 
  Users, Menu, Moon, Sun, BarChart3, HelpCircle, Phone, 
  Library, Flame, Calendar, Map 
} = lucide;

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // رابط الصورة الشخصية الخاصة بك
  const teacherImg = "https://i.ibb.co/9j74J07/42938.png";

  const lectures = [
    { title: "المحاضرة الأولى: أنواع الروابط والرابطة الآيونية والتساهمية", url: "https://youtu.be/3SQy6j9qdX0" },
    { title: "شرح الدرس الثاني: الجزء الأول - نظرية الثمانيات", url: "https://youtu.be/KIdHLm_BtRt" },
    { title: "شرح الدرس الثاني: الجزء الثاني - أنواع الروابط والتهجين", url: "https://youtu.be/1JIVypRTUxI" },
    { title: "شرح الدرس الثالث: الجزء الأول - نظرية VSEPR", url: "https://youtu.be/u7rTOP0lpak" },
    { title: "شرح باقي الدرس الثالث والرابع: الروابط التناسقية والفيزيائية", url: "https://youtu.be/UFOsYtmHuCc" }
  ];

  const wafiSolutions = [
    { title: "حل كتاب الوافي: الدرس الأول - ج1", url: "https://youtu.be/hh34oRhXBN8" },
    { title: "حل كتاب الوافي: الدرس الأول - ج2", url: "https://youtu.be/gMqM3Uf2mYQ" },
    { title: "حل كتاب الوافي: الدرس الثاني - ج1", url: "https://youtu.be/NGF1Fq1C0Ko" },
    { title: "حل كتاب الوافي: الدرس الثاني - ج2", url: "https://youtu.be/hzWbMiMdzNM" },
    { title: "حل كتاب الوافي: الدرس الثالث - ج1", url: "https://youtu.be/GYMWKuc7DPE" },
    { title: "حل كتاب الوافي: الدرس الثالث - ج2", url: "https://youtu.be/-uV1gcbPLok" },
    { title: "حل كتاب الوافي: الدرس الرابع", url: "https://youtu.be/OsWMUW2ex54" }
  ];

  const examSolutions = [
    { title: "حل كتاب الامتحان: الدرس الأول - ج1", url: "https://youtu.be/0QY_ZaZ8_40" },
    { title: "حل كتاب الامتحان: الدرس الأول - ج2", url: "https://youtu.be/ZgZeeNdcbFE" },
    { title: "حل كتاب الامتحان: الدرس الثاني - ج1", url: "https://youtu.be/ILCeerSB1RU" },
    { title: "حل كتاب الامتحان: الدرس الثاني - ج2", url: "https://youtu.be/pbzdb3i7DRg" },
    { title: "حل كتاب الامتحان: الدرس الثالث - ج1", url: "https://youtu.be/R9_i6tuI58Y" },
    { title: "حل كتاب الامتحان: الدرس الثالث - ج2", url: "https://youtu.be/Cfuc-OTXsJ4" },
    { title: "حل كتاب الامتحان: الدرس الرابع", url: "https://youtu.be/NJW2hdFXj0Q" }
  ];

  const navLinks = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'lectures', label: 'المحاضرات' },
    { id: 'solutions', label: 'حل الكتب' },
    { id: 'camp', label: 'معسكر الشقيان' },
    { id: 'plan', label: 'خطة التفوق' },
    { id: 'contact', label: 'تواصل معنا' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] font-['Cairo',sans-serif] selection:bg-yellow-500/30" dir="rtl">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        body { font-family: 'Cairo', sans-serif; }
        .gold-gradient { background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); }
        .gold-text { background: linear-gradient(to bottom, #FFD700, #B8860B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; background: rgba(184, 134, 11, 0.15); filter: blur(100px); border-radius: 50%; z-index: -1; }
        .teacher-frame { border: 4px solid rgba(184, 134, 11, 0.3); box-shadow: 0 0 50px rgba(184, 134, 11, 0.2); }
      `}</style>

      {/* --- Header --- */}
      <nav className="fixed top-0 w-full z-[1000] bg-black/80 backdrop-blur-xl border-b border-white/5 h-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentPage('home')}>
          <div className="w-12 h-12 rounded-full overflow-hidden teacher-frame">
            <img src={teacherImg} className="w-full h-full object-cover" alt="Ziad" />
          </div>
          <div>
            <h1 className="text-xl font-black gold-text leading-none">يلا كيمياء</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Mr. Ziad Mabrouk</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <button key={link.id} onClick={() => setCurrentPage(link.id)}
              className={`text-sm font-bold transition-all ${currentPage === link.id ? 'text-yellow-500 underline underline-offset-8' : 'text-white/60 hover:text-white'}`}>
              {link.label}
            </button>
          ))}
        </div>

        <button onClick={() => setIsMenuOpen(true)} className="lg:hidden text-yellow-500"><Menu size={28}/></button>
      </nav>

      {/* --- Hero Section --- */}
      {currentPage === 'home' && (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-right space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full text-xs font-black text-yellow-500">
                <Flame size={14} /> منصتك الأولى لتعلم وفهم الكيمياء
              </div>
              <h1 className="text-5xl lg:text-7xl font-black leading-[1.2]">إمبراطور الكيمياء<br/><span className="gold-text">زياد مبروك</span></h1>
              <p className="text-lg text-white/50 font-medium max-w-xl mx-auto lg:mx-0">نظام تعليمي متكامل بيخلي الكيمياء مادة ممتعة وسهلة. شرح وافي، حل كل الكتب الخارجية، ومتابعة دورية للوصول للدرجة النهائية.</p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                <button onClick={() => setCurrentPage('lectures')} className="gold-gradient text-black px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-500/20">ابدأ المذاكرة الآن</button>
                <button onClick={() => setCurrentPage('contact')} className="bg-white/5 border border-white/10 px-10 py-4 rounded-2xl font-black text-lg hover:bg-white/10 transition-all">تواصل معنا</button>
              </div>
            </div>
            
            <div className="relative order-1 lg:order-2 flex justify-center">
              <div className="hero-glow"></div>
              <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden teacher-frame bg-gradient-to-b from-yellow-500/20 to-black relative">
                <img src={teacherImg} className="w-full h-full object-cover scale-110 mt-4" />
              </div>
              <div className="absolute -bottom-6 -right-6 lg:right-10 bg-[#111] p-6 rounded-3xl border border-white/10 flex items-center gap-4 animate-bounce">
                <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center text-black"><Trophy size={24}/></div>
                <div><h4 className="text-xl font-black">100%</h4><p className="text-[10px] opacity-40">نسبة التفوق</p></div>
              </div>
            </div>
          </div>

          <div className="mt-40 grid md:grid-cols-3 gap-8">
            {[
              { title: 'شرح احترافي', desc: 'كل دروس المنهج مشروحة بأسلوب مبسط وشامل.', icon: <Video/>, page: 'lectures' },
              { title: 'حل شامل', desc: 'حل كتب الوافي والامتحان بالتفصيل الممل.', icon: <BookOpen/>, page: 'solutions' },
              { title: 'معسكر الشقيان', desc: 'مراجعات نهائية مكثفة تلم المنهج في وقت قياسي.', icon: <Zap/>, page: 'camp' }
            ].map((box, i) => (
              <div key={i} onClick={() => setCurrentPage(box.page)} className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[3rem] hover:border-yellow-600 transition-all cursor-pointer group">
                <div className="text-yellow-600 mb-6 group-hover:scale-110 transition-all">{box.icon}</div>
                <h3 className="text-2xl font-black mb-3">{box.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{box.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Lectures Page --- */}
      {currentPage === 'lectures' && (
        <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto space-y-12">
          <div className="text-center italic">
            <h2 className="text-4xl font-black gold-text">محاضرات الشرح</h2>
            <p className="text-white/40 mt-2">رحلة التفوق تبدأ من هنا</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {lectures.map((v, i) => (
              <div key={i} className="bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-yellow-600/30 transition-all shadow-2xl">
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                  <img src={`https://img.youtube.com/vi/${v.url.split('/').pop()}/maxresdefault.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-all" />
                  <a href={v.url} target="_blank" className="relative z-10 w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all"><Play fill="currentColor" size={24}/></a>
                </div>
                <div className="p-8">
                  <h4 className="text-lg font-bold mb-4 min-h-[50px]">{v.title}</h4>
                  <a href={v.url} target="_blank" className="flex items-center justify-between text-yellow-500 font-black">شاهد الآن <ChevronRight size={18}/></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Solutions Page --- */}
      {currentPage === 'solutions' && (
        <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-blue-500 border-b border-white/10 pb-4 flex items-center gap-3">كتاب الوافي <BookOpen size={24}/></h3>
            {wafiSolutions.map((v, i) => (
              <a key={i} href={v.url} target="_blank" className="flex items-center justify-between p-5 bg-[#0c0c0c] rounded-2xl border border-white/5 hover:bg-yellow-600 hover:text-black transition-all group">
                <span className="font-bold text-sm">{v.title}</span> <Play size={18}/>
              </a>
            ))}
          </div>
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-green-500 border-b border-white/10 pb-4 flex items-center gap-3">كتاب الامتحان <GraduationCap size={24}/></h3>
            {examSolutions.map((v, i) => (
              <a key={i} href={v.url} target="_blank" className="flex items-center justify-between p-5 bg-[#0c0c0c] rounded-2xl border border-white/5 hover:bg-yellow-600 hover:text-black transition-all group">
                <span className="font-bold text-sm">{v.title}</span> <Play size={18}/>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* --- Contact Page --- */}
      {currentPage === 'contact' && (
        <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center space-y-16">
          <h2 className="text-5xl font-black italic gold-text">تواصل مع المستر</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'تليجرام', icon: <Send/>, color: 'bg-sky-500', link: 'https://t.me/+b1mElPFg6bdmZmM8' },
              { label: 'فيسبوك', icon: <Facebook/>, color: 'bg-blue-600', link: 'https://www.facebook.com/profile.php?id=61586645950011' },
              { label: 'واتساب', icon: <MessageCircle/>, color: 'bg-green-600', link: 'https://chat.whatsapp.com/FrYkCnO3DTt3ugCkYKMLJp' },
              { label: 'يوتيوب', icon: <Youtube/>, color: 'bg-red-600', link: 'https://youtube.com/channel/UCi5O6yRE_0EThRbspiryP3w' }
            ].map((s, i) => (
              <a key={i} href={s.link} target="_blank" className={`p-8 rounded-[2rem] ${s.color} flex flex-col items-center gap-4 hover:scale-105 transition-all shadow-xl shadow-black`}>
                {s.icon} <span className="font-black text-xs uppercase">{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] bg-black p-10 flex flex-col gap-8 animate-in fade-in duration-300">
          <button onClick={() => setIsMenuOpen(false)} className="self-end"><X size={40}/></button>
          {navLinks.map(link => (
            <button key={link.id} onClick={() => { setCurrentPage(link.id); setIsMenuOpen(false); }} className="text-3xl font-black text-right italic hover:text-yellow-500 transition-colors">{link.label}</button>
          ))}
        </div>
      )}

    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
