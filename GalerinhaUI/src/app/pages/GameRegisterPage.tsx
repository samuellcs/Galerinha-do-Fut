import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChevronLeft, Flag, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

export const GameRegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, teams, users, addGameEvent, finishMatch, getMatchStats } = useApp();
  const navigate = useNavigate();

  const match = matches.find(m => m.id === id);
  const matchTeams = teams.filter(t => t.matchId === id);
  const stats = useMemo(() => match ? getMatchStats(match.id) : {}, [match, getMatchStats]);

  if (!match) return <div className="text-foreground">Pelada não encontrada</div>;

  const getPlayer = (pid: string) => users.find(u => u.id === pid);

  const getTeamScore = (teamId: string) => {
    const team = matchTeams.find(t => t.id === teamId);
    if (!team) return 0;
    return team.playerIds.reduce((acc, pid) => acc + (stats[pid]?.goals || 0), 0);
  };

  const handleGoal = (pid: string) => {
    if (match.status === 'finished') return;
    addGameEvent(match.id, pid, 'goal');
  };

  const handleAssist = (pid: string) => {
    if (match.status === 'finished') return;
    addGameEvent(match.id, pid, 'assist');
  };

  const handleFinish = () => {
    if (window.confirm('Tem certeza que deseja finalizar a pelada?')) {
      finishMatch(match.id);
      navigate(`/match/${match.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/match/${match.id}/draw`}>
            <Button variant="ghost" size="sm" className="-ml-2">
              <ChevronLeft className="w-5 h-5" />
              Times
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Placar</h1>
        </div>
        
        {match.status !== 'finished' && (
          <Button variant="destructive" size="sm" onClick={handleFinish}>
            Finalizar Jogo
          </Button>
        )}
      </div>

      {/* Scoreboard */}
      <Card className="bg-primary text-primary-foreground p-6 flex items-center justify-center gap-8 shadow-lg">
        <div className="text-center">
          <h3 className="text-sm opacity-80 mb-1">{matchTeams[0]?.name || 'Time A'}</h3>
          <span className="text-5xl font-bold">{getTeamScore(matchTeams[0]?.id)}</span>
        </div>
        <div className="text-2xl font-bold opacity-50">X</div>
        <div className="text-center">
          <h3 className="text-sm opacity-80 mb-1">{matchTeams[1]?.name || 'Time B'}</h3>
          <span className="text-5xl font-bold">{getTeamScore(matchTeams[1]?.id)}</span>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {matchTeams.map((team) => (
          <div key={team.id} className="space-y-3">
            <h3 className="font-bold text-foreground px-1">{team.name}</h3>
            {team.playerIds.map(pid => {
              const player = getPlayer(pid);
              if (!player) return null;
              const playerStats = stats[pid] || { goals: 0, assists: 0 };
              
              return (
                <motion.div 
                  layout
                  key={pid} 
                  className="bg-card p-3 rounded-xl border border-border shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold">
                      {player.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-tight text-foreground">{player.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span>⚽ {playerStats.goals}</span>
                        <span>👟 {playerStats.assists}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                     <button
                       onClick={() => handleGoal(pid)}
                       disabled={match.status === 'finished'}
                       className="w-10 h-10 rounded-full bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center transition-colors disabled:opacity-50"
                       title="Gol"
                     >
                       ⚽
                     </button>
                     <button
                       onClick={() => handleAssist(pid)}
                       disabled={match.status === 'finished'}
                       className="w-10 h-10 rounded-full bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors disabled:opacity-50"
                       title="Assistência"
                     >
                       👟
                     </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      
      {match.status === 'finished' && (
        <div className="p-4 bg-muted text-center text-muted-foreground rounded-xl">
          Partida finalizada. Estatísticas congeladas.
        </div>
      )}
    </div>
  );
};
