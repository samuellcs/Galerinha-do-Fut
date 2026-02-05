import React from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, User as UserIcon, Trophy, Calendar, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Button } from './ui/Button';

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-[#1E7F43] font-bold text-xl tracking-tight">
          <span>⚽</span>
          <span className="hidden sm:inline">GalerinhaDoFut</span>
          <span className="sm:hidden">GDF</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          <Link to="/home">
            <Button variant="ghost" size="sm" className={location.pathname === '/home' ? 'text-[#1E7F43] bg-green-50' : ''}>
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Agenda</span>
            </Button>
          </Link>
          <Link to="/ranking">
            <Button variant="ghost" size="sm" className={location.pathname === '/ranking' ? 'text-[#1E7F43] bg-green-50' : ''}>
              <Trophy className="w-5 h-5" />
              <span className="hidden sm:inline">Ranking</span>
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3FB984] flex items-center justify-center text-white font-bold text-sm">
              {currentUser.avatar}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {currentUser.name.split(' ')[0]}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
