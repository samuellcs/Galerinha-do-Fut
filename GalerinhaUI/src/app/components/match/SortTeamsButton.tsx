import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shuffle } from 'lucide-react';

interface SortTeamsButtonProps {
  disabled?: boolean;
  onSort: () => Promise<void> | void;
}

export const SortTeamsButton: React.FC<SortTeamsButtonProps> = ({ disabled = false, onSort }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    setShuffleKey(prev => prev + 1);

    // Simulate shuffle animation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    await onSort();
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.button
        onClick={handleClick}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.03 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
        className={`
          relative group w-full max-w-md mx-auto h-14 rounded-2xl font-bold text-base
          flex items-center justify-center gap-3 overflow-hidden
          transition-all duration-300 cursor-pointer
          ${disabled
            ? 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/30 cursor-not-allowed'
            : 'bg-gradient-to-r from-[#d4af37] to-[#e8c547] text-[#0B0B0F] border border-[#d4af37]/30 shadow-[0_0_24px_rgba(212,175,55,0.15)] hover:shadow-[0_0_40px_rgba(212,175,55,0.3)]'
          }
        `}
      >
        {/* Glow effect */}
        {!disabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/0 via-white/20 to-[#d4af37]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
        )}

        {isLoading ? (
          <div className="flex items-center gap-3">
            {/* Shuffle animation */}
            <motion.div
              key={shuffleKey}
              animate={{
                rotate: [0, 180, 360, 540, 720],
                scale: [1, 1.2, 1, 1.2, 1],
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <Shuffle className="w-5 h-5" />
            </motion.div>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              Embaralhando...
            </motion.span>
          </div>
        ) : (
          <>
            <Shuffle className="w-5 h-5" />
            <span>Sortear Times</span>
          </>
        )}
      </motion.button>

      {!disabled && (
        <p className="text-xs text-zinc-600 text-center">
          Dividir automaticamente em equipes equilibradas
        </p>
      )}
    </motion.div>
  );
};
