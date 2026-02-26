import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router';
import { InputField } from './InputField';
import { PrimaryButton } from './PrimaryButton';
import { Checkbox } from '../ui/checkbox';

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export const LoginForm: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Informe seu usuário';
    }

    if (!password.trim()) {
      newErrors.password = 'Informe sua senha';
    } else if (password.length < 3) {
      newErrors.password = 'Senha muito curta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('https://galerinha-do-fut.onrender.com/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.user) {
        const user = {
          id: data.data.user.id.toString(),
          name: data.data.user.name,
          email: data.data.user.email || '',
          avatar: data.data.user.avatar,
        };
        login(user);
        localStorage.setItem('access_token', data.data.tokens.access);
        localStorage.setItem('refresh_token', data.data.tokens.refresh);
        navigate('/home');
      } else {
        setErrors({ general: data.detail || 'Credenciais inválidas' });
      }
    } catch {
      setErrors({ general: 'Erro ao conectar com o servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField
        id="username"
        type="text"
        label="Usuário"
        placeholder="Digite seu usuário"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
        }}
        icon={User}
        error={errors.username}
        disabled={isLoading}
        required
      />

      <div className="relative">
        <InputField
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          icon={Lock}
          error={errors.password}
          disabled={isLoading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-[42px] text-white/25 hover:text-white/50 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-white/20 data-[state=checked]:bg-[#d4af37] data-[state=checked]:border-[#d4af37]"
          />
          <label
            htmlFor="remember"
            className="text-xs text-white/40 cursor-pointer select-none"
          >
            Lembrar de mim
          </label>
        </div>
        <button
          type="button"
          className="text-xs text-[#d4af37]/60 hover:text-[#d4af37] transition-colors"
        >
          Esqueci minha senha
        </button>
      </div>

      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 bg-red-400/[0.06] border border-red-400/10 px-4 py-3 rounded-xl text-center"
        >
          {errors.general}
        </motion.div>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <PrimaryButton type="submit" loading={isLoading} disabled={isLoading}>
          Entrar
        </PrimaryButton>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] text-white/20 uppercase tracking-widest">ou</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <PrimaryButton variant="secondary" disabled={isLoading}>
          Entrar como visitante
        </PrimaryButton>
      </div>
    </form>
  );
};
