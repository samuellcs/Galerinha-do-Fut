import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Match {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  format?: '4x4' | '5x5';
  status: 'open' | 'active' | 'finished';
  confirmedPlayerIds: string[];
}

export interface Team {
  id: string;
  matchId: string;
  name: string;
  playerIds: string[];
}

export interface GameEvent {
  id: string;
  matchId: string;
  playerId: string;
  type: 'goal' | 'assist';
  timestamp: number;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  matches: Match[];
  teams: Team[];
  gameEvents: GameEvent[];
  login: (email: string) => void;
  logout: () => void;
  registerUser: (name: string, email: string) => void;
  createMatch: (match: Omit<Match, 'id' | 'status' | 'confirmedPlayerIds'>) => Promise<string>;
  confirmPresence: (matchId: string) => void;
  updateMatch: (matchId: string, data: Partial<Match>) => void;
  loadMatches: (matches: Match[]) => void;
  generateTeams: (matchId: string) => void;
  addGameEvent: (matchId: string, playerId: string, type: 'goal' | 'assist') => void;
  finishMatch: (matchId: string) => void;
  getMatchStats: (matchId: string) => { [playerId: string]: { goals: number; assists: number } };
  getGlobalStats: () => { playerId: string; goals: number; assists: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'João Silva', email: 'joao@example.com', avatar: 'JS' },
  { id: 'u2', name: 'Pedro Santos', email: 'pedro@example.com', avatar: 'PS' },
  { id: 'u3', name: 'Lucas Oliveira', email: 'lucas@example.com', avatar: 'LO' },
  { id: 'u4', name: 'Mateus Costa', email: 'mateus@example.com', avatar: 'MC' },
  { id: 'u5', name: 'Gabriel Pereira', email: 'gabriel@example.com', avatar: 'GP' },
  { id: 'u6', name: 'Rafael Souza', email: 'rafael@example.com', avatar: 'RS' },
  { id: 'u7', name: 'Bruno Lima', email: 'bruno@example.com', avatar: 'BL' },
  { id: 'u8', name: 'Thiago Rocha', email: 'thiago@example.com', avatar: 'TR' },
  { id: 'u9', name: 'Felipe Alves', email: 'felipe@example.com', avatar: 'FA' },
  { id: 'u10', name: 'André Martins', email: 'andre@example.com', avatar: 'AM' },
];

// Dados iniciais vazios - peladas serão criadas via API
const INITIAL_MATCHES: Match[] = [];
const INITIAL_TEAMS: Team[] = [];
const INITIAL_EVENTS: GameEvent[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializar estados do localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });
  
  const [gameEvents, setGameEvents] = useState<GameEvent[]>(() => {
    const saved = localStorage.getItem('gameEvents');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  // Persistir currentUser no localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Persistir teams no localStorage
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  // Persistir gameEvents no localStorage
  useEffect(() => {
    localStorage.setItem('gameEvents', JSON.stringify(gameEvents));
  }, [gameEvents]);

  const login = (emailOrUser: string | User) => {
    if (typeof emailOrUser === 'string') {
      const user = users.find(u => u.email === emailOrUser);
      if (user) {
        setCurrentUser(user);
      } else {
        alert('Usuário não encontrado!');
      }
    } else {
      setCurrentUser(emailOrUser);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const registerUser = (name: string, email: string) => {
    const newUser: User = {
      id: `u${users.length + 1}`,
      name,
      email,
      avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
  };

  const createMatch = async (matchData: Omit<Match, 'id' | 'status' | 'confirmedPlayerIds'>): Promise<string> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://galerinha-do-fut.onrender.com/api/peladas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: matchData.name,
          date: matchData.date,
          time: matchData.time,
          location: matchData.location,
          format: matchData.format || '5x5'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pelada');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Adiciona a pelada criada ao estado local
        const newMatch: Match = {
          id: data.data.id.toString(),
          name: data.data.name,
          date: data.data.date,
          time: data.data.time,
          location: data.data.location,
          format: data.data.format || '5x5',
          status: data.data.status || 'open',
          confirmedPlayerIds: [],
        };
        setMatches([newMatch, ...matches]);
        return newMatch.id;
      }
      
      throw new Error('Resposta inv\u00e1lida da API');
    } catch (error) {
      console.error('Erro ao criar pelada:', error);
      // Fallback para mock em caso de erro
      const newMatch: Match = {
        ...matchData,
        id: `m${matches.length + 1}`,
        status: 'open',
        confirmedPlayerIds: currentUser ? [currentUser.id] : [],
      };
      setMatches([newMatch, ...matches]);
      return newMatch.id;
    }
  };

  const updateMatch = (matchId: string, data: Partial<Match>) => {
    setMatches(prev => {
      const exists = prev.some(m => m.id === matchId);
      if (exists) {
        return prev.map(m => m.id === matchId ? { ...m, ...data } : m);
      }
      // Upsert: adiciona o match se não existir ainda
      const newMatch: Match = {
        id: matchId,
        name: data.name || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        format: data.format || '5x5',
        status: data.status || 'open',
        confirmedPlayerIds: data.confirmedPlayerIds || [],
      };
      return [newMatch, ...prev];
    });
  };

  const loadMatches = (newMatches: Match[]) => {
    setMatches(newMatches);
  };

  const confirmPresence = (matchId: string) => {
    if (!currentUser) return;
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        if (m.confirmedPlayerIds.includes(currentUser.id)) {
          return { ...m, confirmedPlayerIds: m.confirmedPlayerIds.filter(id => id !== currentUser.id) };
        } else {
          return { ...m, confirmedPlayerIds: [...m.confirmedPlayerIds, currentUser.id] };
        }
      }
      return m;
    }));
  };

  const generateTeams = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // Simple shuffle
    const shuffled = [...match.confirmedPlayerIds].sort(() => 0.5 - Math.random());
    const mid = Math.ceil(shuffled.length / 2);
    const teamAIds = shuffled.slice(0, mid);
    const teamBIds = shuffled.slice(mid);

    const newTeams: Team[] = [
      { id: `t${Date.now()}_A`, matchId, name: 'Time A', playerIds: teamAIds },
      { id: `t${Date.now()}_B`, matchId, name: 'Time B', playerIds: teamBIds },
    ];

    // Remove existing teams for this match and add new ones
    setTeams(prev => [...prev.filter(t => t.matchId !== matchId), ...newTeams]);
    
    // Set match to active
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'active' } : m));
  };

  const addGameEvent = (matchId: string, playerId: string, type: 'goal' | 'assist') => {
    const newEvent: GameEvent = {
      id: `e${Date.now()}`,
      matchId,
      playerId,
      type,
      timestamp: Date.now(),
    };
    setGameEvents(prev => [...prev, newEvent]);
  };

  const finishMatch = (matchId: string) => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'finished' } : m));
  };

  const getMatchStats = (matchId: string) => {
    const matchEvents = gameEvents.filter(e => e.matchId === matchId);
    const stats: { [playerId: string]: { goals: number; assists: number } } = {};
    
    matchEvents.forEach(e => {
      if (!stats[e.playerId]) stats[e.playerId] = { goals: 0, assists: 0 };
      if (e.type === 'goal') stats[e.playerId].goals++;
      if (e.type === 'assist') stats[e.playerId].assists++;
    });
    return stats;
  };

  const getGlobalStats = () => {
    const stats: { [playerId: string]: { goals: number; assists: number } } = {};
    gameEvents.forEach(e => {
      if (!stats[e.playerId]) stats[e.playerId] = { goals: 0, assists: 0 };
      if (e.type === 'goal') stats[e.playerId].goals++;
      if (e.type === 'assist') stats[e.playerId].assists++;
    });
    
    return Object.entries(stats).map(([playerId, stat]) => ({
      playerId,
      ...stat
    }));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, matches, teams, gameEvents,
      login, logout, registerUser, createMatch, confirmPresence, updateMatch,
      loadMatches, generateTeams, addGameEvent, finishMatch, getMatchStats, getGlobalStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
