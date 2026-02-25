import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ChevronLeft, Trophy, CheckCircle, RotateCcw, Shuffle, Flag,
  Hash, Star, Target, Zap, Shield, TrendingUp, ArrowRightLeft, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlayerData {
  id: number;
  name: string;
  nickname?: string;
  displayName?: string;
}

interface TeamData {
  id: number;
  name: string;
  players: PlayerData[];
  goals_count: number;
}

interface StatEvent {
  id: number;
  player_id: number;
  player_name: string;
  type: 'goal' | 'assist';
}

interface MatchData {
  id: number;
  status: string;
  teams: TeamData[];
  events: StatEvent[];
  stats: Record<string, { goals: number; assists: number }>;
}

interface PlayerSummary {
  playerId: number;
  playerName: string;
  totalGoals: number;
  totalAssists: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  participationsPerMatch: number;
  winPercentage: number;
  mvpScore: number;
}

// ─── Stats calculation ───────────────────────────────────────────────────────

function calculatePlayerStats(matches: MatchData[]): PlayerSummary[] {
  const map = new Map<number, PlayerSummary>();

  matches
    .filter((m) => m.status === 'finished')
    .forEach((match) => {
      const [teamA, teamB] = match.teams;
      if (!teamA || !teamB) return;

      const aWon = teamA.goals_count > teamB.goals_count;
      const bWon = teamB.goals_count > teamA.goals_count;

      match.teams.forEach((team, tIdx) => {
        const won = tIdx === 0 ? aWon : bWon;
        const lost = tIdx === 0 ? bWon : aWon;

        team.players.forEach((player) => {
          const s = match.stats[String(player.id)] || { goals: 0, assists: 0 };
          if (!map.has(player.id)) {
            map.set(player.id, {
              playerId: player.id,
              playerName: getDisplayName(player),
              totalGoals: 0,
              totalAssists: 0,
              matchesPlayed: 0,
              matchesWon: 0,
              matchesLost: 0,
              matchesDrawn: 0,
              participationsPerMatch: 0,
              winPercentage: 0,
              mvpScore: 0,
            });
          }
          const p = map.get(player.id)!;
          p.totalGoals += s.goals;
          p.totalAssists += s.assists;
          p.matchesPlayed += 1;
          if (won) p.matchesWon += 1;
          else if (lost) p.matchesLost += 1;
          else p.matchesDrawn += 1;
        });
      });
    });

  const list = Array.from(map.values());
  list.forEach((p) => {
    p.participationsPerMatch =
      p.matchesPlayed > 0
        ? parseFloat(((p.totalGoals + p.totalAssists) / p.matchesPlayed).toFixed(2))
        : 0;
    p.winPercentage =
      p.matchesPlayed > 0
        ? parseFloat(((p.matchesWon / p.matchesPlayed) * 100).toFixed(0))
        : 0;
    // MVP: gols valem 3, assists 1.5, vitória 15pts cada, participação/jogo 5pts
    p.mvpScore =
      p.totalGoals * 3 +
      p.totalAssists * 1.5 +
      p.matchesWon * 15 +
      p.participationsPerMatch * 5;
  });

  return list.sort((a, b) => b.mvpScore - a.mvpScore);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_BASE = 'http://192.168.0.52:8006';

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  };
}

function getDisplayName(p: PlayerData): string {
  return p.displayName || p.nickname || p.name;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export const GameRegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allMatches, setAllMatches] = useState<MatchData[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchData | null>(null);
  const [peladaFinished, setPeladaFinished] = useState(false);
  const [peladaPlayerIds, setPeladaPlayerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // Substituição
  const [showSubstitute, setShowSubstitute] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerData[]>([]);
  const [selectedOutIds, setSelectedOutIds] = useState<number[]>([]); // quem sai
  const [selectedNewIds, setSelectedNewIds] = useState<number[]>([]); // quem entra
  const [substituting, setSubstituting] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const playerStats = useMemo(() => calculatePlayerStats(allMatches), [allMatches]);
  const mvp = playerStats[0] ?? null;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      // Fetch pelada status
      const peladaRes = await fetch(`${API_BASE}/api/peladas/${id}/`, { headers: authHeaders() });
      const peladaData = await peladaRes.json();
      if (peladaData.success) {
        setPeladaFinished(peladaData.data.status === 'finished');
        setPeladaPlayerIds((peladaData.data.confirmed_player_ids || []).map(Number));
      }

      // Fetch matches list
      const listRes = await fetch(`${API_BASE}/api/matches/?pelada=${id}`, { headers: authHeaders() });
      const listData = await listRes.json();
      if (!listData.success) return;

      const matches: MatchData[] = await Promise.all(
        listData.data.map(async (m: { id: number }) => {
          const res = await fetch(`${API_BASE}/api/matches/${m.id}/`, { headers: authHeaders() });
          const d = await res.json();
          return d.success ? d.data : null;
        })
      );

      const valid = matches.filter(Boolean).sort((a, b) => a.id - b.id);
      setAllMatches(valid);
      setActiveMatch(valid.find((m) => m.status === 'active') ?? null);
    } catch (err) {
      console.error('Erro ao buscar partidas:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAddStat = async (playerId: number, type: 'goal' | 'assist') => {
    if (!activeMatch) return;
    const res = await fetch(`${API_BASE}/api/matches/${activeMatch.id}/stats/`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ player_id: playerId, type }),
    });
    const data = await res.json();
    if (data.success) {
      const upd = data.data.match;
      setActiveMatch(upd);
      setAllMatches((prev) => prev.map((m) => (m.id === upd.id ? upd : m)));
    } else {
      alert(data.error?.message || 'Erro ao registrar');
    }
  };

  const handleRemoveStat = async (statId: number) => {
    if (!activeMatch) return;
    const res = await fetch(`${API_BASE}/api/matches/${activeMatch.id}/stats/`, {
      method: 'DELETE', headers: authHeaders(),
      body: JSON.stringify({ stat_id: statId }),
    });
    const data = await res.json();
    if (data.success) {
      const upd = data.data.match;
      setActiveMatch(upd);
      setAllMatches((prev) => prev.map((m) => (m.id === upd.id ? upd : m)));
    }
  };

  const handleFinishMatch = async () => {
    if (!activeMatch || !confirm('Finalizar esta partida?')) return;
    setFinishing(true);
    try {
      const res = await fetch(`${API_BASE}/api/matches/${activeMatch.id}/finish/`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) await fetchAll();
      else alert(data.error?.message || 'Erro ao finalizar');
    } finally {
      setFinishing(false);
    }
  };

  const handleNewMatch = async () => {
    setStartingNew(true);
    try {
      const res = await fetch(`${API_BASE}/api/peladas/${id}/draw-teams/`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ numTeams: 2 }),
      });
      const data = await res.json();
      if (data.success) await fetchAll();
      else alert(data.error?.message || 'Erro ao sortear times');
    } finally {
      setStartingNew(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Encerrar a pelada? Não será possível iniciar novas partidas.')) return;
    setEndingSession(true);
    try {
      const res = await fetch(`${API_BASE}/api/peladas/${id}/finish/`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setPeladaFinished(true);
        await fetchAll();
      } else {
        alert(data.error?.message || 'Erro ao encerrar');
      }
    } finally {
      setEndingSession(false);
    }
  };

  const openSubstituteModal = async () => {
    setSelectedOutIds([]);
    setSelectedNewIds([]);
    setShowSubstitute(true);
    setLoadingAvailable(true);
    try {
      // Busca dados frescos da pelada + lista de jogadores em paralelo
      const [peladaRes, playersRes] = await Promise.all([
        fetch(`${API_BASE}/api/peladas/${id}/`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/players/`, { headers: authHeaders() }),
      ]);
      const [peladaData, playersData] = await Promise.all([
        peladaRes.json(),
        playersRes.json(),
      ]);

      const confirmedIds = new Set<number>(
        ((peladaData.success ? peladaData.data.confirmed_player_ids : []) || []).map(Number)
      );
      // IDs de quem jogou a última partida (qualquer time)
      const playingIds = new Set<number>(
        (lastFinishedMatch?.teams ?? []).flatMap((t) => t.players.map((p) => Number(p.id)))
      );

      const all: PlayerData[] = playersData.success ? playersData.data : [];
      // "Entram": confirmado na pelada E não jogou a última partida
      const filtered = all.filter((p) => confirmedIds.has(Number(p.id)) && !playingIds.has(Number(p.id)));
      setAvailablePlayers(filtered);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleSubstitute = async () => {
    if (!lastFinishedMatch || !losingTeam) return;

    const winningTeam = lastFinishedMatch.teams.find((t) => t.id !== losingTeam.id) ?? lastFinishedMatch.teams[0];

    const newLosingPlayers = losingTeam.players
      .filter((p) => !selectedOutIds.includes(p.id))
      .map((p) => p.id);
    const enteringIds = selectedNewIds;
    const newTeamPlayerIds = [...newLosingPlayers, ...enteringIds];

    setSubstituting(true);
    try {
      const res = await fetch(`${API_BASE}/api/peladas/${id}/substitute-match/`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          teams: [
            { name: winningTeam.name, player_ids: winningTeam.players.map((p) => p.id) },
            { name: losingTeam.name, player_ids: newTeamPlayerIds },
          ],
        }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchAll();
        setShowSubstitute(false);
        setSelectedOutIds([]);
        setSelectedNewIds([]);
      } else {
        alert(data.error?.message || 'Erro ao criar partida com substituições');
      }
    } finally {
      setSubstituting(false);
    }
  };

  const toggleOutPlayer = (playerId: number) => {
    setSelectedOutIds((prev) =>
      prev.includes(playerId) ? prev.filter((x) => x !== playerId) : [...prev, playerId]
    );
  };

  const toggleNewPlayer = (playerId: number) => {
    setSelectedNewIds((prev) =>
      prev.includes(playerId) ? prev.filter((x) => x !== playerId) : [...prev, playerId]
    );
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const finishedMatches = [...allMatches]
    .sort((a, b) => a.id - b.id)
    .filter((m) => m.status === 'finished');
  const lastFinishedMatch = finishedMatches[finishedMatches.length - 1] ?? null;
  const losingTeam = useMemo(() => {
    if (!lastFinishedMatch || lastFinishedMatch.teams.length < 2) return null;
    const [a, b] = lastFinishedMatch.teams;
    if (a.goals_count < b.goals_count) return a;
    if (b.goals_count < a.goals_count) return b;
    return a; // empate → substitui teamA
  }, [lastFinishedMatch]);
  const isDraw = lastFinishedMatch
    ? lastFinishedMatch.teams[0]?.goals_count === lastFinishedMatch.teams[1]?.goals_count
    : false;
  const roundOf = (m: MatchData) => allMatches.indexOf(m) + 1;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="text-zinc-500 text-sm">
          Carregando partidas...
        </motion.div>
      </div>
    );
  }

  if (!loading && allMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-zinc-400 text-sm">Nenhuma partida encontrada.</p>
        <p className="text-zinc-600 text-xs">Sorteie os times primeiro.</p>
        <Link to={`/match/${id}`}>
          <button className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors group cursor-pointer">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar
          </button>
        </Link>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-24">

      {/* Cabeçalho */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between">
        <Link to={`/match/${id}`}>
          <button className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors group cursor-pointer">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar
          </button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500 border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 rounded-full">
          <Hash className="w-3 h-3" />
          {allMatches.length} partida{allMatches.length !== 1 ? 's' : ''}
          {peladaFinished && <span className="ml-1 text-[#d4af37]">· Encerrada</span>}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          RESUMO FINAL (pelada encerrada)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {peladaFinished && playerStats.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-4">

            {/* Banner encerrada */}
            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.05] p-5 text-center">
              <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-1">Pelada encerrada</p>
              <p className="text-white text-2xl font-black">{finishedMatches.length} partida{finishedMatches.length !== 1 ? 's' : ''} jogadas</p>
            </div>

            {/* MVP */}
            {mvp && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/[0.03] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">MVP do Dia</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#d4af37]/15 border-2 border-[#d4af37]/40 flex items-center justify-center text-lg font-black text-[#d4af37]">
                    {initials(mvp.playerName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg leading-tight">{mvp.playerName}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-zinc-400">
                      <span className="flex items-center gap-1"><span>⚽</span>{mvp.totalGoals} gols</span>
                      <span className="flex items-center gap-1"><span>👟</span>{mvp.totalAssists} assists</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{mvp.participationsPerMatch} p/jogo</span>
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-[#d4af37]" />{mvp.winPercentage}% vitórias</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">score</p>
                    <p className="text-2xl font-black text-[#d4af37]">{Math.round(mvp.mvpScore)}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tabela de estatísticas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estatísticas da Pelada</h3>
              </div>

              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 border-b border-white/[0.04]">
                <span>Jogador</span>
                <span className="text-center w-7" title="Gols"><Target className="w-3 h-3 mx-auto" /></span>
                <span className="text-center w-7" title="Assistências"><Zap className="w-3 h-3 mx-auto" /></span>
                <span className="text-center w-10" title="Participações por partida">P/J</span>
                <span className="text-center w-7" title="Vitórias"><Shield className="w-3 h-3 mx-auto" /></span>
                <span className="text-center w-7" title="Derrotas">D</span>
                <span className="text-center w-10" title="% Vitórias">V%</span>
              </div>

              {/* Linhas */}
              {playerStats.map((p, idx) => (
                <motion.div key={p.playerId}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.04 }}
                  className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-3 px-4 py-2.5 items-center border-b border-white/[0.03] last:border-0 ${
                    idx === 0 ? 'bg-[#d4af37]/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}>
                  {/* Nome */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      idx === 0
                        ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                        : 'bg-white/[0.06] text-zinc-400'
                    }`}>
                      {initials(p.playerName)}
                    </div>
                    <span className={`text-sm font-medium truncate ${idx === 0 ? 'text-[#d4af37]' : 'text-white'}`}>
                      {p.playerName}
                    </span>
                    {idx === 0 && <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37] flex-shrink-0" />}
                  </div>

                  {/* Gols */}
                  <span className="w-7 text-center text-sm font-bold text-white">{p.totalGoals}</span>
                  {/* Assists */}
                  <span className="w-7 text-center text-sm text-zinc-300">{p.totalAssists}</span>
                  {/* P/J */}
                  <span className="w-10 text-center text-xs text-zinc-400">{p.participationsPerMatch}</span>
                  {/* Vitórias */}
                  <span className="w-7 text-center text-sm text-emerald-400">{p.matchesWon}</span>
                  {/* Derrotas */}
                  <span className="w-7 text-center text-sm text-rose-400">{p.matchesLost}</span>
                  {/* % vitórias */}
                  <span className={`w-10 text-center text-xs font-medium ${
                    p.winPercentage >= 60 ? 'text-emerald-400' :
                    p.winPercentage >= 40 ? 'text-zinc-300' : 'text-rose-400'
                  }`}>{p.winPercentage}%</span>
                </motion.div>
              ))}

              {/* Legenda */}
              <div className="px-4 py-2 border-t border-white/[0.04] flex flex-wrap gap-3 text-[10px] text-zinc-600">
                <span><Target className="w-2.5 h-2.5 inline mr-0.5" />Gols</span>
                <span><Zap className="w-2.5 h-2.5 inline mr-0.5" />Assistências</span>
                <span>P/J = Participações por jogo</span>
                <span><Shield className="w-2.5 h-2.5 inline mr-0.5" />Vitórias · D = Derrotas · V% = % vitórias</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          PARTIDA ATIVA
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {!peladaFinished && activeMatch && (
          <motion.div key="active" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} className="space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Partida {roundOf(activeMatch)}</h2>
              <span className="text-xs text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                Em andamento
              </span>
            </div>

            {/* Placar */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <div className="flex items-center justify-center gap-8">
                {activeMatch.teams.map((team, i) => (
                  <React.Fragment key={team.id}>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">{team.name}</p>
                      <span className={`text-6xl font-black ${i === 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {team.goals_count}
                      </span>
                    </div>
                    {i === 0 && <span className="text-3xl font-bold text-zinc-700">×</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Times */}
            <div className="grid md:grid-cols-2 gap-4">
              {activeMatch.teams.map((team, tIdx) => (
                <div key={team.id} className={`rounded-2xl border p-4 ${
                  tIdx === 0 ? 'border-sky-500/20 bg-sky-500/[0.04]' : 'border-rose-500/20 bg-rose-500/[0.04]'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${tIdx === 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                    {team.name}
                  </h3>
                  <div className="space-y-2">
                    {team.players.map((player) => {
                      const s = activeMatch.stats[String(player.id)] || { goals: 0, assists: 0 };
                      const name = getDisplayName(player);
                      return (
                        <div key={player.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            tIdx === 0 ? 'bg-sky-500/15 text-sky-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {initials(name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{name}</p>
                            {(s.goals > 0 || s.assists > 0) && (
                              <div className="flex gap-2 text-xs text-zinc-500 mt-0.5">
                                {s.goals > 0 && <span>⚽ {s.goals}</span>}
                                {s.assists > 0 && <span>👟 {s.assists}</span>}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => handleAddStat(player.id, 'goal')}
                              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-[#d4af37]/20 hover:scale-110 text-sm flex items-center justify-center transition-all cursor-pointer" title="Gol">
                              ⚽
                            </button>
                            <button onClick={() => handleAddStat(player.id, 'assist')}
                              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.12] hover:scale-110 text-sm flex items-center justify-center transition-all cursor-pointer" title="Assistência">
                              👟
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Eventos */}
            <AnimatePresence>
              {activeMatch.events.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Eventos</h3>
                  <div className="space-y-1">
                    {[...activeMatch.events].reverse().map((ev) => (
                      <motion.div key={ev.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.03] group">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <span>{ev.type === 'goal' ? '⚽' : '👟'}</span>
                          <span className="font-medium">{ev.player_name}</span>
                          <span className="text-zinc-600 text-xs">{ev.type === 'goal' ? 'Gol' : 'Assistência'}</span>
                        </div>
                        <button onClick={() => handleRemoveStat(ev.id)}
                          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <RotateCcw className="w-3 h-3" /> desfazer
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Finalizar */}
            <div className="flex justify-center pt-2">
              <button onClick={handleFinishMatch} disabled={finishing}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#e8c547] text-[#0B0B0F] text-sm font-bold hover:shadow-[0_0_32px_rgba(212,175,55,0.25)] transition-all duration-300 cursor-pointer disabled:opacity-60">
                <CheckCircle className="w-4 h-4" />
                {finishing ? 'Finalizando...' : 'Finalizar Partida'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Sem partida ativa ─────────────────────────────────────────────── */}
        {!peladaFinished && !activeMatch && (
          <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center mx-auto">
              <Trophy className="w-5 h-5 text-[#d4af37]" />
            </div>
            {finishedMatches.length > 0 ? (
              <>
                <p className="text-white font-semibold">Partida {finishedMatches.length} finalizada!</p>

                {/* Resultado da última partida */}
                {lastFinishedMatch && lastFinishedMatch.teams.length >= 2 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 inline-flex items-center gap-4 mx-auto">
                    {lastFinishedMatch.teams.map((team, i) => (
                      <React.Fragment key={team.id}>
                        <div className="text-center">
                          <p className={`text-xs mb-1 font-medium ${
                            !isDraw && losingTeam?.id === team.id ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {team.name}
                            {!isDraw && losingTeam?.id !== team.id && ' 🏆'}
                            {!isDraw && losingTeam?.id === team.id && ' ↓'}
                          </p>
                          <span className={`text-3xl font-black ${
                            !isDraw && losingTeam?.id === team.id ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {team.goals_count}
                          </span>
                        </div>
                        {i === 0 && <span className="text-zinc-700 font-bold">×</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <p className="text-zinc-500 text-sm">Inicie uma nova rodada ou encerre a pelada.</p>
              </>
            ) : (
              <p className="text-zinc-400 text-sm">Nenhuma partida ativa no momento.</p>
            )}

            <div className="flex flex-col gap-3 items-center pt-2">
              {/* Substituir time perdedor */}
              {finishedMatches.length > 0 && (
                <button onClick={openSubstituteModal}
                  className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-sky-400/30 bg-sky-400/[0.07] text-sm font-semibold text-sky-300 hover:bg-sky-400/[0.12] hover:border-sky-400/40 transition-all cursor-pointer">
                  <ArrowRightLeft className="w-4 h-4" />
                  Substituir Jogadores
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button onClick={handleNewMatch} disabled={startingNew}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#e8c547] text-[#0B0B0F] text-sm font-bold hover:shadow-[0_0_32px_rgba(212,175,55,0.25)] transition-all cursor-pointer disabled:opacity-60">
                  <Shuffle className="w-4 h-4" />
                  {startingNew ? 'Sorteando...' : 'Nova Partida'}
                </button>
                <button onClick={handleEndSession} disabled={endingSession}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer disabled:opacity-60">
                  <Flag className="w-4 h-4" />
                  {endingSession ? 'Encerrando...' : 'Encerrar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          HISTÓRICO
      ══════════════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════════════
          MODAL SUBSTITUIÇÃO
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSubstitute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={() => !substituting && setShowSubstitute(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0B0B0F] overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                  <span className="text-white font-semibold text-sm">Substituir Jogadores</span>
                </div>
                <button onClick={() => setShowSubstitute(false)} disabled={substituting}
                  className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Quem sai — apenas o time perdedor */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                      Quem sai — {losingTeam?.name ?? '—'}
                      {isDraw && <span className="text-zinc-500 normal-case font-normal ml-1">(empate)</span>}
                    </p>
                    <span className="text-[10px] text-zinc-600">
                      {selectedOutIds.length > 0
                        ? `${selectedOutIds.length} selecionado${selectedOutIds.length !== 1 ? 's' : ''}`
                        : 'toque para selecionar'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(losingTeam?.players ?? []).map((p) => {
                      const leaving = selectedOutIds.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => toggleOutPlayer(p.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            leaving
                              ? 'border-rose-500/40 bg-rose-500/[0.09] text-white'
                              : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                          }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            leaving ? 'bg-rose-500/20 text-rose-300' : 'bg-white/[0.06] text-zinc-500'
                          }`}>
                            {leaving ? '↑' : initials(getDisplayName(p))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{getDisplayName(p)}</p>
                            {p.nickname && p.name !== p.nickname && (
                              <p className="text-[10px] text-zinc-600 truncate">{p.name}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mx-5 h-px bg-white/[0.04]" />

                {/* Quem entra — confirmados no banco */}
                <div className="px-5 pt-3 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Quem entra — Banco
                    </p>
                    {selectedNewIds.length > 0 && (
                      <span className="text-[10px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                        {selectedNewIds.length} selecionado{selectedNewIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {loadingAvailable ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-sky-400/30 border-t-sky-400 rounded-full" />
                    </div>
                  ) : availablePlayers.length === 0 ? (
                    <p className="text-zinc-600 text-xs text-center py-6">
                      Nenhum jogador confirmado no banco.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availablePlayers.map((p) => {
                        const selected = selectedNewIds.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => toggleNewPlayer(p.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              selected
                                ? 'border-emerald-400/40 bg-emerald-400/[0.09] text-white'
                                : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                              selected ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/[0.06] text-zinc-500'
                            }`}>
                              {selected ? '✓' : initials(getDisplayName(p))}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{getDisplayName(p)}</p>
                              {p.nickname && p.name !== p.nickname && (
                                <p className="text-[10px] text-zinc-600 truncate">{p.name}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-white/[0.06] flex gap-3">
                <button onClick={() => setShowSubstitute(false)} disabled={substituting}
                  className="flex-1 h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleSubstitute} disabled={substituting || selectedOutIds.length === 0 || selectedNewIds.length !== selectedOutIds.length}
                  className="flex-1 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
                  {substituting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-3.5 h-3.5 border-2 border-sky-300/30 border-t-sky-300 rounded-full" />
                      Substituindo...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {finishedMatches.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Hash className="w-3.5 h-3.5" />
            Histórico — {finishedMatches.length} partida{finishedMatches.length !== 1 ? 's' : ''}
          </h2>

          {[...finishedMatches].reverse().map((match) => {
            const [teamA, teamB] = match.teams;
            return (
              <motion.div key={match.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 font-medium">Partida {roundOf(match)}</span>
                  <div className="flex items-center gap-3 text-lg font-black">
                    <span className="text-sky-400">{teamA?.goals_count ?? 0}</span>
                    <span className="text-zinc-600 text-sm">×</span>
                    <span className="text-rose-400">{teamB?.goals_count ?? 0}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {match.teams.map((team, tIdx) => (
                    <div key={team.id}>
                      <p className={`font-semibold mb-1 ${tIdx === 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {team.name}
                      </p>
                      {team.players.map((p) => {
                        const s = match.stats[String(p.id)] || { goals: 0, assists: 0 };
                        return (
                          <div key={p.id} className="flex items-center justify-between py-0.5 text-zinc-400">
                            <span className="truncate">{getDisplayName(p)}</span>
                            <span className="text-zinc-600 ml-2 flex-shrink-0">
                              {s.goals > 0 && `⚽${s.goals}`}
                              {s.assists > 0 && ` 👟${s.assists}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
