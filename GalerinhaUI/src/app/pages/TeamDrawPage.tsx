import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ChevronLeft, RefreshCw, Trophy, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamDrawPlayer {
  id: number;
  name: string;
  displayName: string;
  avatar: string;
}

interface TeamDrawTeam {
  id: string;
  name: string;
  players: TeamDrawPlayer[];
}

export const TeamDrawPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, teams, users, generateTeams } = useApp();
  const navigate = useNavigate();
  const [substitutes, setSubstitutes] = useState<TeamDrawPlayer[]>([]);
  const [drawnTeams, setDrawnTeams] = useState<TeamDrawTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const match = matches.find(m => m.id === id);
  const matchTeams = teams.filter(t => t.matchId === id);

  // Fetch teams from the API (Match detail)
  const fetchMatchDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Try to get match data from the pelada's match
      const response = await fetch(`https://galerinha-do-fut.onrender.com/api/peladas/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Could use this for any additional data if needed
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatchDetail();
  }, [fetchMatchDetail]);

  if (!match) return <div className="text-foreground">Pelada não encontrada</div>;

  const getPlayer = (pid: string) => users.find(u => u.id === pid);

  const handleRedraw = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://galerinha-do-fut.onrender.com/api/peladas/${id}/draw-teams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ numTeams: 2 }),
      });

      const data = await response.json();
      if (data.success) {
        // Update substitutes from response
        const subs = (data.data.substitutes || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName ?? p.display_name ?? p.name,
          avatar: p.avatar ?? '',
        }));
        setSubstitutes(subs);
      }
    } catch (error) {
      console.error('Erro ao re-sortear:', error);
    }
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
            <Card className="h-full border-t-4 border-t-primary">
              <div className="bg-muted -mx-4 -mt-4 p-4 border-b border-border mb-4 flex justify-between items-center">
                <h3 className="font-bold text-lg text-foreground">{team.name}</h3>
                <span className="bg-card px-2 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border">
                  {team.playerIds.length} jogadores
                </span>
              </div>
              
              <ul className="space-y-3">
                {team.playerIds.map(pid => {
                  const player = getPlayer(pid);
                  if (!player) return null;
                  return (
                    <li key={pid} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold">
                        {player.avatar}
                      </div>
                      <span className="text-foreground font-medium">{(player as any).displayName || (player as any).nickname || player.name}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Substitutes (de próxima) */}
      {substitutes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-t-4 border-t-amber-500">
            <div className="bg-muted -mx-4 -mt-4 p-4 border-b border-border mb-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                De Próxima
              </h3>
              <span className="bg-card px-2 py-1 rounded-md text-xs font-medium text-muted-foreground border border-border">
                {substitutes.length} jogador{substitutes.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <ul className="space-y-3">
              {substitutes.map(player => (
                <li key={player.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold">
                    {player.avatar || player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-foreground font-medium">{player.displayName || player.name}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      )}

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
          className="flex-1 shadow-lg shadow-yellow-200"
        >
          <Trophy className="w-5 h-5" /> 
          {match.status === 'finished' ? 'Ver Resultados' : 'Informar Resultados'}
        </Button>
      </div>
    </div>
  );
};
