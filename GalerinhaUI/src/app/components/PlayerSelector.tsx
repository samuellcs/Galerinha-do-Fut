import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Player {
  id: number;
  name: string;
  nickname: string;
  displayName: string;
  skillLevel: number;
  skillDisplay: string;
  avatar: string;
}

interface PlayerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (playerIds: number[]) => void;
  alreadyAddedIds?: number[];
}

export const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  isOpen,
  onClose,
  onConfirm,
  alreadyAddedIds = []
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://192.168.0.52:8006/api/players/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Erro ao carregar jogadores:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Players loaded:', data);
      
      // A API retorna uma lista diretamente ou {success, data}?
      const playersList = Array.isArray(data) ? data : (data.success ? data.data : []);
      setPlayers(playersList || []);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (playerId: number) => {
    setSelectedIds(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedIds);
    setSelectedIds([]);
    onClose();
  };

  const availablePlayers = players.filter(p => !alreadyAddedIds.includes(p.id));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold">Adicionar Jogadores</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selection Counter */}
          {selectedIds.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 bg-green-50">
              <p className="text-sm font-medium text-green-700">
                {selectedIds.length} jogador(es) selecionado(s)
              </p>
            </div>
          )}

          {/* Players List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Carregando jogadores...
              </div>
            ) : availablePlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhum jogador disponível
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePlayers.map((player) => {
                  const isSelected = selectedIds.includes(player.id);
                  return (
                    <motion.div
                      key={player.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => togglePlayer(player.id)}
                      className={`
                        p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {isSelected ? '✓' : player.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {player.displayName}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
            >
              <UserPlus className="w-4 h-4" />
              Adicionar {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
