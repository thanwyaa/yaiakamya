'use client';

import { useTheme } from '@/hooks/useTheme';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full glass-card">
      {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-neon-blue" />}
    </button>
  );
}
