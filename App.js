import React, { useState, useEffect } from 'react';
import { lecturesData } from './LecturesData';
import { CheckCircle2, Youtube, Layout, X } from 'lucide-react';
import './App.css';

const App = () => {
  const [completed, setCompleted] = useState([]);
  const [showInstall, setShowInstall] = useState(true);

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

  return (
    <div className="app-container" dir="rtl">
      {/* البار العلوي */}
      <header className="fixed top-0 w-full z-50 bg-[#111d17]/80 backdrop-blur-md border-b border-[#c5a02e]/20 p-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <img src="42938.png" className="w-12 h-12 rounded-full border-2 border-[#c5a02e] shadow-glow" alt="لوجو" />
          <div>
            <h1 className="text-[#c5a02e] font-black text-lg leading-none">منصة يلا كيمياء</h1>
            <p className="text-white/50 text-[10px] mt-1">مستر زياد مبروك</p>
          </div>
        </div>
      </header>

      {/* عرض المحاضرات */}
      <main className="p-6 pt-24 pb-40 max-w-4xl mx-auto">
        {lecturesData.map((section, sIdx) => (
          <div key={sIdx} className="mb-10">
            <h2 className="text-[#c5a02e] font-black text-xl mb-4 flex items-center gap-2">
              <Layout size={20} /> {section.category}
            </h2>
            <div className="space-y-3">
              {section.items.map((lec) => (
                <div key={lec.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-[#c5a02e]/50 transition-all">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleCheck(lec.id)} className={`${completed.includes(lec.id) ? 'text-[#c5a02e]' : 'text-white/20'}`}>
                      <CheckCircle2 size={24} />
                    </button>
                    <span className={`font-bold text-sm ${completed.includes(lec.id) ? 'text-white/30 line-through' : 'text-white'}`}>{lec.title}</span>
                  </div>
                  <a href={lec.url} target="_blank" className="text-[#c5a02e]"><Youtube size={22} /></a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* تنبيه التثبيت الخرافي */}
      {showInstall && (
        <div className="fixed bottom-6 left-6 right-6 bg-gradient-to-br from-[#1a2b23] to-[#0c1611] border-2 border-[#c5a02e] rounded-[30px] p-5 z-[1000] flex items-center gap-5 shadow-2xl animate-bounce-slow">
          <div className="relative w-14 h-24 bg-gray-800 rounded-xl border-4 border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 phone-bounce">
            <div className="absolute top-1 w-6 h-1 bg-gray-700 rounded-full"></div>
            <img src="42938.png" className="w-8 h-8 rounded-full" alt="لوجو" />
          </div>
          <div className="flex-1">
            <h4 className="text-[#c5a02e] font-black text-md mb-1">ثبت المنصة الآن! ⚡</h4>
            <p className="text-white/80 text-[11px] font-medium leading-tight">عشان تتابع منصة مستر زياد مبروك وتوصلك المحاضرات والملفات بسرعة، ثبتها على شاشة موبايلك دلوقتي.</p>
            <button className="mt-2 bg-[#c5a02e] text-[#111d17] px-3 py-1 rounded-full text-[10px] font-black shadow-lg">إضافة للشاشة الرئيسية</button>
          </div>
          <button onClick={() => setShowInstall(false)} className="text-white/30 self-start"><X size={18}/></button>
        </div>
      )}
    </div>
  );
};

export default App;
