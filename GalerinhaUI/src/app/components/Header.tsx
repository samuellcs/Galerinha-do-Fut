import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, Trophy, Calendar } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Button } from './ui/button';

export const Header: React.FC = () => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <span>⚽</span>
          <span className="hidden sm:inline">GalerinhaDoFut</span>
          <span className="sm:hidden">GDF</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          <Link to="/home">
            <Button variant="ghost" size="sm" className={location.pathname === '/home' ? 'text-primary bg-primary/20' : ''}>
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Agenda</span>
            </Button>
          </Link>
          <Link to="/ranking">
            <Button variant="ghost" size="sm" className={location.pathname === '/ranking' ? 'text-primary bg-primary/20' : ''}>
              <Trophy className="w-5 h-5" />
              <span className="hidden sm:inline">Ranking</span>
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm font-medium text-foreground">
            {currentUser.name.split(' ')[0]}
          </span>
          <button 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
