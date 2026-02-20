import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { MatchPlayer } from './types';

interface PlayerCardProps {
  player: MatchPlayer;
  index: number;
  onRemove?: (playerId: number) => void;
  canRemove?: boolean;
}

const positionColors: Record<string, string> = {
  GK: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ZG: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  LD: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  LE: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  VOL: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  MC: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  ME: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  MD: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  AT: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  index,
  onRemove,
  canRemove = false,
}) => {
  const isConfirmed = player.status === 'confirmed';
  const borderColor = isConfirmed ? 'border-emerald-500/20' : 'border-amber-500/20';
  const badgeBg = isConfirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400';
  const badgeLabel = isConfirmed ? 'Confirmado' : 'Pendente';
  const posClass = player.position ? positionColors[player.position] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.85 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl border ${borderColor} bg-white/[0.03] backdrop-blur-sm p-4 cursor-default transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]`}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Remove button */}
      {canRemove && onRemove && (
        <button
          onClick={() => onRemove(player.id)}
          className="absolute top-2 right-2 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 hover:scale-110"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <div className="relative z-10 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${isConfirmed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'} ring-2 ${isConfirmed ? 'ring-emerald-500/20' : 'ring-amber-500/20'}`}>
            {player.avatar || player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{player.displayName || player.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${badgeBg}`}>
              {badgeLabel}
            </span>
            {posClass && player.position && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${posClass}`}>
                {player.position}
              </span>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
