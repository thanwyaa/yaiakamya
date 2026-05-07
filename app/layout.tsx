import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'يلا كيمياء | مع مستر زياد مبروك',
  description: 'الكيمياء بشكل مختلف… فهم + حفظ + حل',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-white dark:bg-dark-500 text-gray-900 dark:text-white transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <ParticleBackground />
            <Navbar />
            <main className="pt-20 min-h-screen">{children}</main>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
