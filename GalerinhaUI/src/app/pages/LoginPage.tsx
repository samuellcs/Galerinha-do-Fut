import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.0.52:8006/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.user) {
        // Passa o objeto user completo para o login
        const user = {
          id: data.data.user.id.toString(),
          name: data.data.user.name,
          email: data.data.user.email || '',
          avatar: data.data.user.avatar,
        };
        login(user);
        // Armazena os tokens
        localStorage.setItem('access_token', data.data.tokens.access);
        localStorage.setItem('refresh_token', data.data.tokens.refresh);
        navigate('/home');
      } else {
        setError(data.detail || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl border-0">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">⚽</div>
            <h1 className="text-2xl font-bold text-primary">GalerinhaDoFut</h1>
            <p className="text-muted-foreground text-sm mt-1">Organize suas peladas com facilidade</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="username"
              type="text"
              label="Usuário"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              id="password"
              type="password"
              label="Senha"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-destructive bg-destructive/20 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-4">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full shadow-lg shadow-primary/30"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
