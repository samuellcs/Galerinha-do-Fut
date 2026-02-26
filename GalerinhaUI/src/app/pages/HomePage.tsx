import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, MapPin, Clock, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

export const HomePage: React.FC = () => {
  const { matches, currentUser, loadMatches } = useApp();

  // Buscar peladas da API ao carregar a página
  useEffect(() => {
    const fetchPeladas = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://192.168.0.52:8006/api/peladas/', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.data) {
          const apiMatches = data.data.map((pelada: any) => ({
            id: pelada.id.toString(),
            name: pelada.name,
            date: pelada.date,
            time: pelada.time,
            location: pelada.location,
            format: pelada.format || '5x5',
            status: pelada.status,
            confirmedPlayerIds: (pelada.confirmed_player_ids || []).map(String),
          }));
          loadMatches(apiMatches);
        }
      } catch (error) {
        console.error('Erro ao buscar peladas:', error);
      }
    };
    fetchPeladas();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-primary/20 text-primary border-primary/40';
      case 'active': return 'bg-primary/30 text-primary border-primary/50';
      case 'finished': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'active': return 'Em andamento';
      case 'finished': return 'Finalizada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda de Peladas</h1>
          <p className="text-muted-foreground text-sm">Próximos jogos e histórico</p>
        </div>
        <Link to="/create-match">
          <Button className="hidden sm:flex shadow-primary/30 shadow-lg">
            <Plus className="w-5 h-5" />
            Criar Pelada
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/match/${match.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                <div className={clsx(
                  "absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl-xl border-b border-l",
                  getStatusColor(match.status)
                )}>
                  {getStatusLabel(match.status)}
                </div>

                <div className="pt-2">
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {match.name}
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(match.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{match.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{match.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                    <div className="flex items-center -space-x-2">
                      {match.confirmedPlayerIds.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] text-foreground">
                          ⚽
                        </div>
                      ))}
                      {match.confirmedPlayerIds.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          +{match.confirmedPlayerIds.length - 3}
                        </div>
                      )}
                      {match.confirmedPlayerIds.length === 0 && (
                        <span className="text-muted-foreground text-xs pl-2">Ninguém confirmou ainda</span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* FAB for mobile */}
      <Link to="/create-match" className="sm:hidden fixed bottom-6 right-6 z-40">
        <Button size="lg" className="rounded-full w-14 h-14 p-0 shadow-xl shadow-green-200">
          <Plus className="w-7 h-7" />
        </Button>
      </Link>
    </div>
  );
};
