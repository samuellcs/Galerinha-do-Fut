import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon: Icon,
  error,
  disabled = false,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-white/70 tracking-wide"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon
            size={18}
            className={`transition-colors duration-300 ${
              error
                ? 'text-red-400'
                : isFocused
                  ? 'text-[#d4af37]'
                  : 'text-white/30'
            }`}
          />
        </div>
        <motion.input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          required={required}
          whileHover={{ borderColor: error ? 'rgba(248,113,113,0.6)' : 'rgba(212,175,55,0.4)' }}
          className={`
            w-full h-12 pl-12 pr-4
            bg-white/[0.04] backdrop-blur-sm
            rounded-xl
            text-white text-sm
            placeholder:text-white/20
            outline-none
            border transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-400/60 shadow-[0_0_15px_rgba(248,113,113,0.1)]'
                : isFocused
                  ? 'border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.08)]'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
            }
          `}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-red-400/90 pl-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
