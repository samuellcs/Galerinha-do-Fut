import React from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChevronLeft, RefreshCw, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const TeamDrawPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, teams, users, generateTeams } = useApp();
  const navigate = useNavigate();

  const match = matches.find(m => m.id === id);
  const matchTeams = teams.filter(t => t.matchId === id);

  if (!match) return <div>Pelada não encontrada</div>;

  const getPlayer = (pid: string) => users.find(u => u.id === pid);

  const handleRedraw = () => {
    generateTeams(match.id);
  };

  const handleStartGame = () => {
    navigate(`/match/${match.id}/game`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/match/${match.id}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Times Sorteados</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {matchTeams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <Card className="h-full border-t-4 border-t-[#1E7F43]">
              <div className="bg-gray-50 -mx-4 -mt-4 p-4 border-b border-gray-100 mb-4 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">{team.name}</h3>
                <span className="bg-white px-2 py-1 rounded-md text-xs font-medium text-gray-500 border border-gray-200">
                  {team.playerIds.length} jogadores
                </span>
              </div>
              
              <ul className="space-y-3">
                {team.playerIds.map(pid => {
                  const player = getPlayer(pid);
                  if (!player) return null;
                  return (
                    <li key={pid} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                        {player.avatar}
                      </div>
                      <span className="text-gray-700 font-medium">{player.name}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-20">
        <Button 
          variant="secondary" 
          onClick={handleRedraw} 
          className="flex-1"
          disabled={match.status === 'finished'}
        >
          <RefreshCw className="w-5 h-5" /> Sortear Novamente
        </Button>
        <Button 
          onClick={handleStartGame} 
          size="lg" 
          className="flex-1 shadow-lg shadow-green-200"
        >
          <PlayCircle className="w-5 h-5" /> 
          {match.status === 'active' || match.status === 'finished' ? 'Ir para o Jogo' : 'Iniciar Jogo'}
        </Button>
      </div>
    </div>
  );
};
