import React from 'react';
import { motion } from 'motion/react';

interface LoginCardProps {
  children: React.ReactNode;
}

export const LoginCard: React.FC<LoginCardProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="
        w-full max-w-[420px]
        bg-white/[0.03] backdrop-blur-xl
        border border-white/[0.06]
        rounded-3xl
        p-10
        shadow-[0_8px_60px_rgba(0,0,0,0.4)]
        relative
        overflow-hidden
      "
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
