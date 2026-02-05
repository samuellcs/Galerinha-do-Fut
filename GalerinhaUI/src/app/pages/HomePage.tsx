import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, MapPin, Clock, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';

export const HomePage: React.FC = () => {
  const { matches, currentUser } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'finished': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
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
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Peladas</h1>
          <p className="text-gray-500 text-sm">Próximos jogos e histórico</p>
        </div>
        <Link to="/create-match">
          <Button className="hidden sm:flex shadow-green-200 shadow-lg">
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
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#1E7F43] transition-colors">
                    {match.name}
                  </h3>
                  
                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(match.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{match.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{match.location}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="flex items-center -space-x-2">
                      {match.confirmedPlayerIds.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] text-gray-600">
                          ⚽
                        </div>
                      ))}
                      {match.confirmedPlayerIds.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{match.confirmedPlayerIds.length - 3}
                        </div>
                      )}
                      {match.confirmedPlayerIds.length === 0 && (
                        <span className="text-gray-400 text-xs pl-2">Ninguém confirmou ainda</span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1E7F43]" />
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
