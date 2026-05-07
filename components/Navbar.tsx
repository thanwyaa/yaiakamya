'use client';

import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { FaUserGraduate } from 'react-icons/fa';

export default function Navbar() {
  const { user, userData, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-t-0 border-x-0 px-4 py-3">
      <div className="container mx-auto flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" className="w-10 h-10 rounded-full border-2 border-neon-blue" />
          <div>
            <h1 className="text-xl font-bold gradient-text">يلا كيمياء</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">مع مستر زياد مبروك</p>
          </div>
        </div>
        <div className="flex gap-6">
          <a href="/" className="hover:text-neon-blue transition">الرئيسية</a>
          <a href="/lectures" className="hover:text-neon-blue transition">المحاضرات</a>
          <a href="/leaderboard" className="hover:text-neon-blue transition">الترتيب</a>
          <a href="/profile" className="hover:text-neon-blue transition">ملفي</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center"><FaUserGraduate className="text-white text-sm" /></div>}
              <span className="text-sm hidden md:block">{user.displayName?.split(' ')[0]}</span>
              {userData && <span className="text-xs text-neon-blue">{userData.chemicalCoins} 🧪</span>}
              <button onClick={logout} className="btn-secondary text-sm py-1 px-3">خروج</button>
            </div>
          ) : (
            <a href="/login" className="btn-primary text-sm py-2 px-5">تسجيل الدخول</a>
          )}
        </div>
      </div>
    </nav>
  );
}
