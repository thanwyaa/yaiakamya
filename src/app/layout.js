'use client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Yalla Kimya | مع مستر زياد مبروك</title>
        <meta name="description" content="منصة تعليمية متكاملة لتعليم الكيمياء مع مستر زياد مبروك" />
      </head>
      <body className="bg-white dark:bg-gray-900 transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <Toaster position="top-center" toastOptions={{
              style: {
                background: '#363636',
                color: '#fff',
              },
            }} />
            <main className="min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
