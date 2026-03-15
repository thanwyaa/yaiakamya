import React, { useState, useEffect } from 'react';
import { lecturesData } from './LecturesData';
import { CheckCircle2, Youtube, Home, Layout, PlayCircle } from 'lucide-react';
import './App.css';

const App = () => {
  const [completed, setCompleted] = useState([]);

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
      {/* الهيدر المحترف */}
      <header className="navbar">
        <div className="flex items-center gap-4">
          <img src="42938.png" className="master-logo" alt="مستر زياد مبروك" />
          <div>
            <h1 className="text-[#c5a02e] font-black text-xl">منصة يلا كيمياء</h1>
            <p className="text-xs opacity-50">مستر زياد مبروك</p>
          </div>
        </div>
      </header>

      {/* عرض كل المحاضرات مع بعضها */}
      <main className="p-6 pt-24 max-w-4xl mx-auto">
        {lecturesData.map((section, sIdx) => (
          <div key={sIdx} className="mb-10">
            <h2 className="text-[#c5a02e] font-black text-2xl mb-6 flex items-center gap-2">
              <Layout size={24} /> {section.category}
            </h2>
            
            <div className="space-y-3">
              {section.items.map((lec) => (
                <div key={lec.id} className="lecture-card group">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleCheck(lec.id)} className={`check-btn ${completed.includes(lec.id) ? 'done' : 'not-done'}`}>
                      <CheckCircle2 size={28} />
                    </button>
                    <span className={`font-bold transition-all ${completed.includes(lec.id) ? 'text-white/30 line-through' : 'text-white'}`}>
                      {lec.title}
                    </span>
                  </div>
                  
                  <a href={lec.url} target="_blank" className="text-[#c5a02e] hover:scale-110 transition-transform">
                    <Youtube size={24} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default App;
