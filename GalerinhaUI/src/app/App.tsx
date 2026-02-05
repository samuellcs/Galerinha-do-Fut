import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CreateMatchPage } from './pages/CreateMatchPage';
import { MatchDetailPage } from './pages/MatchDetailPage';
import { TeamDrawPage } from './pages/TeamDrawPage';
import { GameRegisterPage } from './pages/GameRegisterPage';
import { RankingPage } from './pages/RankingPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/create-match" element={<ProtectedRoute><CreateMatchPage /></ProtectedRoute>} />
            <Route path="/match/:id" element={<ProtectedRoute><MatchDetailPage /></ProtectedRoute>} />
            <Route path="/match/:id/draw" element={<ProtectedRoute><TeamDrawPage /></ProtectedRoute>} />
            <Route path="/match/:id/game" element={<ProtectedRoute><GameRegisterPage /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><RankingPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
