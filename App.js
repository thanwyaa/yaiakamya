// تأكد من تعريف المكتبات في البداية لتجنب الشاشة السوداء
const { useState } = React;
const { 
  Play, Youtube, Instagram, Facebook, Send, MessageCircle, 
  ChevronRight, BookOpen, Trophy, X, Video, Flame, Menu, GraduationCap, Zap 
} = lucide;

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // صورتك الشخصية
  const teacherImg = "https://i.ibb.co/9j74J07/42938.png";

  const navLinks = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'lectures', label: 'المحاضرات' },
    { id: 'solutions', label: 'حل الكتب' },
    { id: 'camp', label: 'معسكر الشقيان' },
    { id: 'contact', label: 'تواصل معنا' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Cairo',sans-serif]" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body { font-family: 'Cairo', sans-serif; margin: 0; }
        .red-gradient { background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%); }
        .teacher-frame { border: 6px solid white; box-shadow: 0 20px 40px rgba(225, 29, 72, 0.15); }
      `}</style>

      {/* Header */}
      <nav className="fixed top-0 w-full z-[1000] bg-white/90 backdrop-blur-md border-b border-slate-100 h-20 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rose-600">
            <img src={teacherImg} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-black text-rose-600 italic">يلا كيمياء</h1>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <button key={link.id} onClick={() => setCurrentPage(link.id)} className={`text-sm font-bold ${currentPage === link.id ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'}`}>{link.label}</button>
          ))}
        </div>
        <button onClick={() => setIsMenuOpen(true)} className="lg:hidden text-rose-600"><Menu size={28}/></button>
      </nav>

      {/* Content */}
      <div className="pt-20">
        {currentPage === 'home' && (
          <section className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right space-y-6">
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900">طريقك للقمة مع<br/><span className="text-rose-600">مستر زياد</span></h1>
              <p className="text-lg text-slate-500 font-medium">أقوى منصة شرح وحل كيمياء لتانية ثانوي في مصر.</p>
              <button onClick={() => setCurrentPage('lectures')} className="red-gradient text-white px-12 py-4 rounded-2xl font-black text-xl shadow-lg">ابدأ المذاكرة</button>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 lg:w-[400px] lg:h-[400px] bg-rose-600 rounded-[3rem] overflow-hidden teacher-frame rotate-3">
                <img src={teacherImg} className="w-full h-full object-cover -rotate-3 scale-110 mt-5" />
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[2000] bg-white p-10 flex flex-col gap-6">
          <button onClick={() => setIsMenuOpen(false)} className="self-end text-rose-600"><X size={40}/></button>
          {navLinks.map(link => (
            <button key={link.id} onClick={() => { setCurrentPage(link.id); setIsMenuOpen(false); }} className="text-2xl font-black text-right text-slate-800 border-b border-slate-50 pb-4">{link.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// تشغيل التطبيق
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
