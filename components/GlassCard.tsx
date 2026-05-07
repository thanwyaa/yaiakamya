'use client';

import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} whileHover={{ scale: 1.02 }} onClick={onClick} className={`glass-card p-6 ${className}`}>
      {children}
    </motion.div>
  );
}
