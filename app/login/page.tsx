'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import GlassCard from '@/components/GlassCard';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      router.push('/');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <GlassCard className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <img src="https://videotourl.com/images/1778184631873-622d780a-8224-4f6e-bf20-3df78ed623b1.jpg" className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-neon-blue" />
          <h2 className="text-2xl font-bold gradient-text">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{isLogin ? 'مرحباً بعودتك!' : 'انضم إلى رحلة التفوق في الكيمياء'}</p>
        </div>

        <button onClick={signInWithGoogle} className="w-full btn-primary flex items-center justify-center gap-2 mb-4 bg-gradient-to-r from-red-500 to-orange-500"><FaGoogle /> {isLogin ? 'تسجيل الدخول بـ Google' : 'إنشاء حساب بـ Google'}</button>

        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-700"></div></div><div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-dark-500 text-gray-500">أو</span></div></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (<div className="relative"><FaUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 pr-10 rounded-xl bg-gray-100 dark:bg-dark-400 border border-gray-300 dark:border-gray-700 focus:border-neon-blue outline-none" required /></div>)}
          <div className="relative"><FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pr-10 rounded-xl bg-gray-100 dark:bg-dark-400 border border-gray-300 dark:border-gray-700 focus:border-neon-blue outline-none" required /></div>
          <div className="relative"><FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pr-10 rounded-xl bg-gray-100 dark:bg-dark-400 border border-gray-300 dark:border-gray-700 focus:border-neon-blue outline-none" required /></div>
          <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'جاري...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}</button>
        </form>

        <p className="text-center text-sm
