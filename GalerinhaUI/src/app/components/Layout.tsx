import React, { ReactNode } from 'react';
import { Header } from './Header';
import { useLocation } from 'react-router';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 sm:pb-10">
      {!isLoginPage && <Header />}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
