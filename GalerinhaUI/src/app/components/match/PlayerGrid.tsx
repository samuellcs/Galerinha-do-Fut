import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Clock } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import type { MatchPlayer, PlayerConfirmation } from './types';

interface PlayerGridProps {
  players: MatchPlayer[];
  filter: PlayerConfirmation;
  onRemovePlayer?: (playerId: number) => void;
  canRemove?: boolean;
}

export const PlayerGrid: React.FC<PlayerGridProps> = ({
  players,
  filter,
  onRemovePlayer,
  canRemove = false,
}) => {
  const filtered = players.filter(p => p.status === filter);
  const isConfirmed = filter === 'confirmed';

  const title = isConfirmed ? 'Jogadores Confirmados' : 'Pendentes';
  const Icon = isConfirmed ? UserCheck : Clock;
  const accentText = isConfirmed ? 'text-emerald-400' : 'text-amber-400';
  const countBg = isConfirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400';

  if (filtered.length === 0 && filter === 'pending') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-5 h-5 ${accentText}`} />
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${countBg}`}>
          {filtered.length}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((player, idx) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={idx}
                onRemove={onRemovePlayer}
                canRemove={canRemove}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]"
        >
          <p className="text-zinc-600 text-sm">
            Nenhum jogador {isConfirmed ? 'confirmado' : 'pendente'} ainda.
          </p>
        </motion.div>
      )}
    </motion.section>
  );
};
