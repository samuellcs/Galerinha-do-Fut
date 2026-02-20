import React from 'react';
import { motion } from 'motion/react';
import { Users, UserCheck, Swords } from 'lucide-react';
import type { MatchPlayer } from './types';

interface MatchStatsProps {
  players: MatchPlayer[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent = 'text-[#d4af37]', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 cursor-default"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <div className="relative z-10 flex items-center gap-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.05] ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  </motion.div>
);

export const MatchStats: React.FC<MatchStatsProps> = ({ players }) => {
  const confirmed = players.filter(p => p.status === 'confirmed');
  const pending = players.filter(p => p.status === 'pending');

  const half = Math.ceil(confirmed.length / 2);
  const division = confirmed.length >= 2
    ? `${half} vs ${confirmed.length - half}`
    : '—';

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon={<UserCheck className="w-5 h-5" />}
        label="Confirmados"
        value={confirmed.length}
        accent="text-emerald-400"
        delay={0.1}
      />
      <StatCard
        icon={<Users className="w-5 h-5" />}
        label="Pendentes"
        value={pending.length}
        accent="text-amber-400"
        delay={0.15}
      />
      <StatCard
        icon={<Swords className="w-5 h-5" />}
        label="Divisão"
        value={division}
        accent="text-sky-400"
        delay={0.2}
      />
    </div>
  );
};
