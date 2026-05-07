'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, isAdmin, logout, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 space-x-reverse">
            <span className="text-2xl">🧪</span>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
              Yalla Kimya
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6 space-x-reverse">
            <Link href="/lectures" className="text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition">
              📚 المحاضرات
            </Link>
            <Link href="/leaderboard" className="text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition">
              🏆 الترتيب
            </Link>
            {user && (
              <Link href="/profile" className="text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition">
                👤 ملفي
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-cyan-500 transition">
                👑 الأدمن
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-500">🪙</span>
                  <span className="font-bold text-yellow-500">{user.coins || 0}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                >
                  خروج
                </button>
              </div>
            ) : isGuest ? (
              <Link href="/login">
                <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition">
                  تسجيل دخول
                </button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition">
                    دخول
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-4 py-2 border border-cyan-500 text-cyan-500 rounded-lg text-sm hover:bg-cyan-500/10 transition">
                    تسجيل
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
