import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Star, Target, Zap, TrendingUp, Shield, Hash, Gamepad2, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RankingEntry {
  position: number;
  playerId: number;
  playerName: string;
  fullName: string;
  avatar: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  peladasPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  winPercentage: number;
  participationsPerMatch: number;
  participationsPerPelada: number;
  points: number;
}

type SortKey = 'points' | 'goals' | 'assists' | 'wins' | 'win_pct';

type PeriodType = 'all_time' | 'year' | 'month';
interface Period {
  type: PeriodType;
  value?: string;   // '2026' | '2026-02'
  label: string;
  param: string;    // query param enviado ao backend
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = 'https://galerinha-do-fut.onrender.com';

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };
}

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Gera os últimos 12 meses (do mais recente para o mais antigo). */
function buildMonthPeriods(): Period[] {
  const now = new Date();
  const periods: Period[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    periods.push({
      type:  'month',
      value: `${yyyy}-${mm}`,
      label: `${PT_MONTHS[d.getMonth()]}/${String(yyyy).slice(2)}`,
      param: `month_${yyyy}-${mm}`,
    });
  }
  return periods;
}

const CURRENT_YEAR = new Date().getFullYear().toString();

const YEAR_PERIOD: Period = {
  type: 'year', value: CURRENT_YEAR,
  label: CURRENT_YEAR,
  param: `year_${CURRENT_YEAR}`,
};
const ALL_TIME_PERIOD: Period = {
  type: 'all_time',
  label: 'All Time',
  param: 'all_time',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// ─── Column definitions ───────────────────────────────────────────────────────

interface Column {
  key: SortKey | null;
  label: string;
  icon?: React.ReactNode;
  title: string;
  render: (entry: RankingEntry) => React.ReactNode;
  className?: string;
}

const COLUMNS: Column[] = [
  {
    key: null, label: '', icon: <CalendarDays className="w-3.5 h-3.5" />, title: 'Peladas (dias jogados)',
    render: e => <span className="text-sky-400 font-medium text-xs">{e.peladasPlayed ?? 0}</span>,
  },
  {
    key: null, label: '', icon: <Gamepad2 className="w-3.5 h-3.5" />, title: 'Partidas jogadas',
    render: e => <span className="text-zinc-300 text-xs">{e.matchesPlayed}</span>,
  },
  {
    key: 'goals', label: '', icon: <Target className="w-3.5 h-3.5" />, title: 'Gols',
    render: e => <span className="font-bold text-white">{e.goals}</span>,
  },
  {
    key: 'assists', label: '', icon: <Zap className="w-3.5 h-3.5" />, title: 'Assistências',
    render: e => <span className="text-zinc-300">{e.assists}</span>,
  },
  {
    key: null, label: 'P/J', title: 'Participações por partida',
    render: e => <span className="text-zinc-400 text-xs">{e.participationsPerMatch}</span>,
  },
  {
    key: null, label: 'P/P', title: 'Participações por pelada',
    render: e => <span className="text-sky-300 text-xs font-medium">{e.participationsPerPelada ?? 0}</span>,
  },
  {
    key: 'wins', label: '', icon: <Shield className="w-3.5 h-3.5" />, title: 'Vitórias',
    render: e => <span className="text-emerald-400 font-medium">{e.matchesWon}</span>,
  },
  {
    key: null, label: 'D', title: 'Derrotas',
    render: e => <span className="text-rose-400">{e.matchesLost}</span>,
  },
  {
    key: 'win_pct', label: 'V%', title: '% de Vitórias',
    render: e => (
      <span className={
        e.winPercentage >= 60 ? 'text-emerald-400 font-medium' :
        e.winPercentage >= 40 ? 'text-zinc-300' : 'text-rose-400'
      }>{e.winPercentage}%</span>
    ),
  },
  {
    key: 'points', label: 'Pts', title: 'Pontuação (gol=3, assist=1, vitória=5)',
    render: e => <span className="text-[#d4af37] font-bold">{e.points}</span>,
    className: 'text-[#d4af37]',
  },
];

// ═════════════════════════════════════════════════════════════════════════════

export const RankingPage: React.FC = () => {
  const [ranking, setRanking]       = useState<RankingEntry[]>([]);
  const [totalMatches, setTotal]    = useState(0);
  const [loading, setLoading]       = useState(true);
  const [sortKey, setSortKey]       = useState<SortKey>('points');
  const [activeTab, setActiveTab]   = useState<'main' | 'monthly'>('main');

  // Período ativo
  const [period, setPeriod] = useState<Period>(YEAR_PERIOD);

  const monthPeriods = useMemo(() => buildMonthPeriods(), []);

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchRanking = useCallback(async (p: Period, sort: SortKey) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/ranking/?period=${p.param}&order_by=${sort}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setRanking(data.data.ranking);
        setTotal(data.data.totalMatches);
      }
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking(period, sortKey);
  }, [period, sortKey, fetchRanking]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSort = (key: SortKey | null) => {
    if (!key) return;
    setSortKey(key);
  };

  const handlePeriodSelect = (p: Period) => {
    setPeriod(p);
    if (p.type === 'month') setActiveTab('monthly');
    else setActiveTab('main');
  };

  // ── Medal / podium helpers ────────────────────────────────────────────────

  const podiumStyle = (pos: number) => {
    if (pos === 1) return { ring: 'border-[#d4af37]/50 bg-[#d4af37]/10', text: 'text-[#d4af37]', num: 'bg-[#d4af37]/15 text-[#d4af37]' };
    if (pos === 2) return { ring: 'border-zinc-400/30 bg-zinc-400/[0.06]', text: 'text-zinc-300', num: 'bg-zinc-400/15 text-zinc-300' };
    if (pos === 3) return { ring: 'border-amber-700/30 bg-amber-700/[0.06]', text: 'text-amber-600', num: 'bg-amber-700/15 text-amber-600' };
    return { ring: 'border-white/[0.06] bg-transparent', text: 'text-zinc-400', num: 'bg-white/[0.05] text-zinc-500' };
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-24">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Ranking</h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            {totalMatches} partida{totalMatches !== 1 ? 's' : ''} · {ranking.length} jogador{ranking.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 rounded-full">
          <Hash className="w-3 h-3" />
          {period.label}
        </div>
      </motion.div>

      {/* ── Seletor de período ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }} className="space-y-3">

        {/* Tabs principais */}
        <div className="flex gap-2">
          {[YEAR_PERIOD, ALL_TIME_PERIOD].map((p) => (
            <button key={p.param}
              onClick={() => handlePeriodSelect(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                period.param === p.param
                  ? 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]'
                  : 'bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white'
              }`}>
              {p.param === `year_${CURRENT_YEAR}` ? `${CURRENT_YEAR} 📅` : '🏆 All Time'}
            </button>
          ))}
          <button
            onClick={() => { setActiveTab('monthly'); if (period.type !== 'month') handlePeriodSelect(monthPeriods[0]); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              period.type === 'month'
                ? 'bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37]'
                : 'bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white'
            }`}>
            📆 Mensal
          </button>
        </div>

        {/* Pills dos meses (últimos 12) */}
        <AnimatePresence>
          {(activeTab === 'monthly' || period.type === 'month') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {monthPeriods.map((p) => (
                  <button key={p.param}
                    onClick={() => handlePeriodSelect(p)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      period.param === p.param
                        ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37]'
                        : 'bg-white/[0.04] border border-white/[0.05] text-zinc-500 hover:text-zinc-300'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Conteúdo ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-zinc-500 text-sm">
              Carregando ranking...
            </motion.div>
          </motion.div>
        ) : ranking.length === 0 ? (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-3">
            <Trophy className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">Nenhum dado para este período.</p>
          </motion.div>
        ) : (
          <motion.div key={period.param}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="space-y-4">

            {/* ── Pódio (top 3) ── */}
            {ranking.length >= 1 && (
              <div className="grid grid-cols-3 gap-3">
                {[ranking[1], ranking[0], ranking[2]].map((entry, pIdx) => {
                  if (!entry) return <div key={pIdx} />;
                  const pos = pIdx === 1 ? 1 : pIdx === 0 ? 2 : 3;
                  const style = podiumStyle(pos);
                  return (
                    <motion.div key={entry.playerId}
                      initial={{ opacity: 0, y: pIdx === 1 ? -12 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * pIdx }}
                      className={`rounded-2xl border p-4 text-center ${style.ring} ${pIdx === 1 ? 'scale-105' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mx-auto mb-2 ${style.num}`}>
                        {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black mx-auto mb-2 border ${style.ring}`}>
                        {initials(entry.playerName)}
                      </div>
                      <p className={`text-xs font-bold truncate ${style.text}`}>{entry.playerName}</p>
                      <p className={`text-lg font-black mt-1 ${style.text}`}>{entry.points}</p>
                      <p className="text-[10px] text-zinc-600">pts</p>
                      <div className="flex justify-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                        <span>⚽{entry.goals}</span>
                        <span>👟{entry.assists}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Tabela completa ── */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">

              {/* Cabeçalho da tabela */}
              <div className="grid items-center border-b border-white/[0.06] px-3 py-2.5
                              grid-cols-[2rem_1fr_2.5rem_2.5rem_2rem_2rem_2.5rem_2.5rem_2rem_2rem_2.5rem_2.5rem]">
                <span className="text-[10px] text-zinc-600 font-bold uppercase">#</span>
                <span className="text-[10px] text-zinc-600 font-bold uppercase">Jogador</span>
                {COLUMNS.map((col) => (
                  <button key={col.title}
                    onClick={() => handleSort(col.key)}
                    title={col.title}
                    disabled={!col.key}
                    className={`text-[10px] font-bold uppercase flex items-center justify-center transition-colors ${
                      col.key
                        ? 'cursor-pointer hover:text-white'
                        : 'cursor-default'
                    } ${
                      sortKey === col.key
                        ? col.className || 'text-white'
                        : 'text-zinc-600'
                    }`}>
                    {col.icon ?? col.label}
                  </button>
                ))}
              </div>

              {/* Linhas */}
              {ranking.map((entry, idx) => {
                const style = podiumStyle(entry.position);
                return (
                  <motion.div key={entry.playerId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * idx }}
                    className={`grid items-center px-3 py-2.5 border-b border-white/[0.03] last:border-0
                                grid-cols-[2rem_1fr_2.5rem_2.5rem_2rem_2rem_2.5rem_2.5rem_2rem_2rem_2.5rem_2.5rem]
                                ${entry.position <= 3 ? style.ring.replace('border-', 'bg-') : 'hover:bg-white/[0.02]'}`}>

                    {/* Posição */}
                    <span className={`text-xs font-bold text-center ${style.text}`}>
                      {entry.position <= 3
                        ? entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : '🥉'
                        : entry.position}
                    </span>

                    {/* Jogador */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${style.ring}`}>
                        {initials(entry.playerName)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${entry.position <= 3 ? style.text : 'text-white'}`}>
                          {entry.playerName}
                        </p>
                        {entry.fullName !== entry.playerName && (
                          <p className="text-[10px] text-zinc-600 truncate">{entry.fullName}</p>
                        )}
                      </div>
                    </div>

                    {/* Colunas dinâmicas */}
                    {COLUMNS.map((col) => (
                      <div key={col.title} className="flex justify-center">
                        {col.render(entry)}
                      </div>
                    ))}
                  </motion.div>
                );
              })}

              {/* Legenda */}
              <div className="px-4 py-2.5 border-t border-white/[0.04] flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-700">
                <span><CalendarDays className="w-2.5 h-2.5 inline mr-0.5" />Peladas (dias)</span>
                <span><Gamepad2 className="w-2.5 h-2.5 inline mr-0.5" />Partidas</span>
                <span><Target className="w-2.5 h-2.5 inline mr-0.5" />Gols</span>
                <span><Zap className="w-2.5 h-2.5 inline mr-0.5" />Assistências</span>
                <span>P/J = Participações/partida · P/P = Participações/pelada</span>
                <span><Shield className="w-2.5 h-2.5 inline mr-0.5" />Vitórias</span>
                <span>D = Derrotas · V% = % vitórias</span>
                <span>Pts: gol×3 + assist×1 + vitória×5</span>
              </div>
            </div>

            {/* MVP do período */}
            {ranking.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                    MVP · {period.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-xs font-black text-[#d4af37]">
                    {initials(ranking[0].playerName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{ranking[0].playerName}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-zinc-400">
                      <span>⚽ {ranking[0].goals}</span>
                      <span>👟 {ranking[0].assists}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{ranking[0].participationsPerMatch} p/j</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{ranking[0].participationsPerPelada} p/p</span>
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-[#d4af37]" />{ranking[0].winPercentage}% vitórias</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600 uppercase">score</p>
                    <p className="text-2xl font-black text-[#d4af37]">{ranking[0].points}</p>
                  </div>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
