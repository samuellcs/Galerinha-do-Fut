import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { MatchInfo } from './types';

const statusConfig = {
  open: { label: 'Aberta', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  active: { label: 'Em Andamento', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  finished: { label: 'Finalizada', bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30', dot: 'bg-zinc-400' },
};

interface MatchHeaderProps {
  match: MatchInfo;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({ match }) => {
  const status = statusConfig[match.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/[0.02] rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left: Title + status */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {match.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
              {status.label}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#d4af37]/70" />
              <span className="capitalize">{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37]/70" />
              <span>{match.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#d4af37]/70" />
              <span>{match.location}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
