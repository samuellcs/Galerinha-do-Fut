import React from 'react';
import { motion } from 'motion/react';
import { LoginCard } from '../components/login/LoginCard';
import { LoginForm } from '../components/login/LoginForm';

const FloatingBall: React.FC = () => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    className="text-5xl select-none"
  >
    ⚽
  </motion.div>
);

const AnimatedBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        opacity: [0.15, 0.25, 0.15],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="
        absolute
        top-[-20%] right-[-10%]
        w-[700px] h-[700px]
        rounded-full
        bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,transparent_70%)]
      "
    />

    <motion.div
      animate={{
        opacity: [0.08, 0.15, 0.08],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
      className="
        absolute
        bottom-[-15%] left-[-5%]
        w-[500px] h-[500px]
        rounded-full
        bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_70%)]
      "
    />

    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0B0B0F_75%)]" />
  </div>
);

export const LoginPage: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0B0B0F]">
      <AnimatedBackground />

      <div className="relative z-10 w-full px-4 flex items-center justify-center">
        <LoginCard>
          <div className="flex flex-col items-center mb-8">
            <FloatingBall />

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="
                mt-4 text-2xl font-bold
                bg-gradient-to-r from-[#d4af37] to-[#e8c547]
                bg-clip-text text-transparent
                tracking-tight
              "
            >
              GalerinhaDoFut
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-1.5 text-sm text-white/30"
            >
              Organize suas peladas com facilidade
            </motion.p>
          </div>

          <LoginForm />
        </LoginCard>
      </div>
    </div>
  );
};
