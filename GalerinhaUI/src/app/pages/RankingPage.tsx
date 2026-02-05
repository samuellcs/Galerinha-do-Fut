import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Trophy, Medal } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

export const RankingPage: React.FC = () => {
  const { getGlobalStats, users } = useApp();
  const [tab, setTab] = useState<'goals' | 'assists'>('goals');

  const stats = getGlobalStats();
  
  const sortedStats = [...stats].sort((a, b) => b[tab] - a[tab]);

  const getUser = (id: string) => users.find(u => u.id === id);

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-700';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ranking da Galera</h1>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setTab('goals')}
          className={clsx(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            tab === 'goals' ? "bg-white text-[#1E7F43] shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Artilheiros ⚽
        </button>
        <button
          onClick={() => setTab('assists')}
          className={clsx(
            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
            tab === 'assists' ? "bg-white text-[#1E7F43] shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          Assistências 👟
        </button>
      </div>

      <div className="space-y-3">
        {sortedStats.map((stat, index) => {
          const user = getUser(stat.playerId);
          if (!user) return null;
          
          const value = stat[tab];
          if (value === 0) return null; // Don't show zeros

          return (
            <motion.div
              key={stat.playerId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                <div className={clsx("font-bold text-lg w-6 text-center", getMedalColor(index))}>
                  {index < 3 ? <Medal className="w-6 h-6 mx-auto" /> : index + 1}
                </div>
                
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white shadow-sm">
                  {user.avatar}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{user.name}</h3>
                  <p className="text-xs text-gray-500">
                    {tab === 'goals' ? 'Gols marcados' : 'Assistências realizadas'}
                  </p>
                </div>
                
                <div className="text-2xl font-bold text-[#1E7F43]">
                  {value}
                </div>
              </Card>
            </motion.div>
          );
        })}

        {sortedStats.every(s => s[tab] === 0) && (
          <div className="text-center py-10 text-gray-400">
            Nenhuma estatística registrada ainda.
          </div>
        )}
      </div>
    </div>
  );
};
