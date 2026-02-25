import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  variant = 'primary',
}) => {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.01 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        relative w-full h-12 rounded-xl
        text-sm font-semibold tracking-wide
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed
        cursor-pointer
        overflow-hidden
        ${
          isPrimary
            ? `
              bg-gradient-to-r from-[#d4af37] to-[#e8c547]
              text-[#0B0B0F]
              shadow-[0_4px_25px_rgba(212,175,55,0.25)]
              hover:shadow-[0_4px_35px_rgba(212,175,55,0.4)]
            `
            : `
              bg-white/[0.04] backdrop-blur-sm
              text-white/60
              border border-white/[0.08]
              hover:bg-white/[0.07]
              hover:text-white/80
              hover:border-white/[0.15]
            `
        }
      `}
    >
      {isPrimary && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}

      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Entrando...</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
};
