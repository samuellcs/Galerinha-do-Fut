import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { PlayerSelector } from '../components/PlayerSelector';
import { ChevronLeft, UserPlus, Users, PlayCircle, Trophy, Clock, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchHeader, MatchStats, PlayerGrid, SortTeamsButton } from '../components/match';
import type { MatchPlayer, DrawnTeam } from '../components/match';

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, currentUser, generateTeams, teams, updateMatch } = useApp();
  const navigate = useNavigate();
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawnTeams, setDrawnTeams] = useState<DrawnTeam[] | null>(null);
  const [peladaFormat, setPeladaFormat] = useState<'4x4' | '5x5'>('5x5');
  const [substitutes, setSubstitutes] = useState<MatchPlayer[]>([]);

  const match = matches.find(m => m.id === id);
  const matchTeams = teams.filter(t => t.matchId === id);

  const isAdmin = true;

  // Buscar detalhes da pelada da API
  const fetchPeladaDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://192.168.0.52:8006/api/peladas/${id}/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Erro ao buscar pelada:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        const pelada = data.data;

        // Set format from API
        if (pelada.format) {
          setPeladaFormat(pelada.format);
        }

        const rawPlayers = pelada.confirmedPlayers || pelada.confirmed_players || [];
        const mapped: MatchPlayer[] = rawPlayers.map((p: any) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname ?? '',
          displayName: p.displayName ?? p.display_name ?? p.name,
          skillLevel: p.skillLevel ?? p.skill_level ?? 5,
          skillDisplay: p.skillDisplay ?? p.skill_display ?? '',
          avatar: p.avatar ?? '',
          position: p.position ?? undefined,
          status: 'confirmed' as const,
        }));

        setPlayers(mapped);

        const confirmedIds = (pelada.confirmedPlayerIds || pelada.confirmed_player_ids || []).map(String);
        updateMatch(id!, {
          status: pelada.status,
          confirmedPlayerIds: confirmedIds,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da pelada:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPeladaDetail();
  }, [fetchPeladaDetail]);

  if (loading && !match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-zinc-500 text-sm"
        >
          Carregando partida...
        </motion.div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-500">Pelada não encontrada</p>
      </div>
    );
  }

  const handleDrawTeams = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://192.168.0.52:8006/api/peladas/${id}/draw-teams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          numTeams: 2,
          format: peladaFormat,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const matchData = data.data.match;
        const subsData = data.data.substitutes || [];

        // Map teams from API response
        const teamsFromApi: DrawnTeam[] = (matchData.teams || []).map((t: any) => ({
          name: t.name,
          players: (t.players || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            nickname: p.nickname ?? '',
            displayName: p.displayName ?? p.display_name ?? p.name,
            skillLevel: p.skillLevel ?? p.skill_level ?? 2,
            skillDisplay: p.skillDisplay ?? p.skill_display ?? '',
            avatar: p.avatar ?? '',
            status: 'confirmed' as const,
          })),
        }));

        setDrawnTeams(teamsFromApi);

        // Map substitutes
        const subsPlayers: MatchPlayer[] = subsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname ?? '',
          displayName: p.displayName ?? p.display_name ?? p.name,
          skillLevel: p.skillLevel ?? p.skill_level ?? 2,
          skillDisplay: p.skillDisplay ?? p.skill_display ?? '',
          avatar: p.avatar ?? '',
          status: 'confirmed' as const,
        }));
        setSubstitutes(subsPlayers);

        // Update local match state
        updateMatch(id!, { status: 'active' });
      } else {
        alert(data.error?.message || 'Erro ao sortear times');
      }
    } catch (error) {
      console.error('Erro ao sortear times:', error);
      alert('Erro ao sortear times. Tente novamente.');
    }
  };

  const handleAddPlayers = async (playerIds: number[]) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://192.168.0.52:8006/api/peladas/${id}/add-players/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ player_ids: playerIds }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPeladaDetail();
      } else {
        alert(data.error?.message || 'Erro ao adicionar jogadores');
      }
    } catch (error) {
      console.error('Erro ao adicionar jogadores:', error);
      alert('Erro ao adicionar jogadores');
    }
  };

  const handleRemovePlayer = async (playerId: number) => {
    if (!confirm('Deseja remover este jogador?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://192.168.0.52:8006/api/peladas/${id}/remove-player/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ player_id: playerId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchPeladaDetail();
      } else {
        alert(data.error?.message || 'Erro ao remover jogador');
      }
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
      alert('Erro ao remover jogador');
    }
  };

  const confirmedCount = players.filter(p => p.status === 'confirmed').length;
  const formatPlayersNeeded = peladaFormat === '5x5' ? 10 : 8;

  const handleFormatChange = async (format: '4x4' | '5x5') => {
    setPeladaFormat(format);
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://192.168.0.52:8006/api/peladas/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ format }),
      });
    } catch (error) {
      console.error('Erro ao atualizar formato:', error);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Back navigation */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/home">
          <button className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors duration-200 group cursor-pointer">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Voltar
          </button>
        </Link>
      </motion.div>

      {/* 1) Match Header */}
      <MatchHeader match={match} />

      {/* 2) Stats */}
      <MatchStats players={players} />

      {/* Add players CTA */}
      {match.status === 'open' && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
        >
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#d4af37]" />
              Gerenciar Elenco
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Adicionar ou remover jogadores desta pelada
            </p>
          </div>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.1] transition-all duration-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Escolher Jogadores
          </button>
        </motion.div>
      )}

      {/* 3) Confirmed Players Grid */}
      <PlayerGrid
        players={players}
        filter="confirmed"
        onRemovePlayer={handleRemovePlayer}
        canRemove={isAdmin && match.status === 'open'}
      />

      {/* 4) Pending Players Grid */}
      <PlayerGrid
        players={players}
        filter="pending"
      />

      {/* Drawn Teams Result */}
      <AnimatePresence>
        {drawnTeams && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid md:grid-cols-2 gap-4"
          >
            {drawnTeams.map((team, tIdx) => (
              <motion.div
                key={team.name}
                initial={{ opacity: 0, x: tIdx === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + tIdx * 0.15 }}
                className={`rounded-2xl border p-5 ${
                  tIdx === 0
                    ? 'border-sky-500/20 bg-sky-500/[0.04]'
                    : 'border-rose-500/20 bg-rose-500/[0.04]'
                }`}
              >
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
                  tIdx === 0 ? 'text-sky-400' : 'text-rose-400'
                }`}>
                  <Users className="w-4 h-4" />
                  {team.name}
                  <span className="ml-auto text-xs font-normal text-zinc-500">
                    {team.players.length} jogadores
                  </span>
                </h3>
                <div className="space-y-2">
                  {team.players.map((p, pIdx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + pIdx * 0.06 }}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03]"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        tIdx === 0
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {p.avatar || p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-white font-medium truncate flex-1">
                        {p.displayName || p.name}
                      </span>

                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Substitutes (de próxima) */}
      <AnimatePresence>
        {drawnTeams && substitutes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-amber-400">
              <Clock className="w-4 h-4" />
              De Próxima
              <span className="ml-auto text-xs font-normal text-zinc-500">
                {substitutes.length} jogador{substitutes.length !== 1 ? 'es' : ''}
              </span>
            </h3>
            <div className="space-y-2">
              {substitutes.map((p, pIdx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + pIdx * 0.06 }}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03]"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-amber-500/15 text-amber-400">
                    {p.avatar || p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium truncate flex-1">
                    {p.displayName || p.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5) Format Selector + Sort Teams */}
      {match.status === 'open' && !drawnTeams && (
        <>
          {/* Format Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
          >
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-[#d4af37]" />
              Modalidade da Pelada
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFormatChange('5x5')}
                className={`relative py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  peladaFormat === '5x5'
                    ? 'border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'
                }`}
              >
                <span className="text-lg">5 x 5</span>
                <p className="text-[10px] mt-0.5 opacity-70">10 jogadores</p>
                {peladaFormat === '5x5' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4af37]" />
                )}
              </button>
              <button
                onClick={() => handleFormatChange('4x4')}
                className={`relative py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  peladaFormat === '4x4'
                    ? 'border-[#d4af37]/40 bg-[#d4af37]/10 text-[#d4af37]'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'
                }`}
              >
                <span className="text-lg">4 x 4</span>
                <p className="text-[10px] mt-0.5 opacity-70">8 jogadores</p>
                {peladaFormat === '4x4' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4af37]" />
                )}
              </button>
            </div>
            {confirmedCount > 0 && (
              <p className="text-[11px] text-zinc-500 mt-3">
                {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''} · 
                {' '}{formatPlayersNeeded} necessário{formatPlayersNeeded !== 1 ? 's' : ''} · 
                {confirmedCount > formatPlayersNeeded 
                  ? ` ${confirmedCount - formatPlayersNeeded} ficam de próxima`
                  : confirmedCount === formatPlayersNeeded 
                    ? ' Pronto para sortear!'
                    : ` Faltam ${formatPlayersNeeded - confirmedCount}`
                }
              </p>
            )}
          </motion.div>

          <SortTeamsButton
            disabled={confirmedCount < formatPlayersNeeded}
            onSort={handleDrawTeams}
          />
        </>
      )}

      {/* Post-draw navigation */}
      {drawnTeams && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex flex-col gap-3 items-center"
        >
          <Link to={`/match/${match.id}/draw`} className="w-full max-w-md">
            <button className="w-full h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.1] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
              <Users className="w-4 h-4" />
              Ver Times Completos
            </button>
          </Link>
          <Link to={`/match/${match.id}/game`} className="w-full max-w-md">
            <button className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#e8c547] text-[#0B0B0F] text-sm font-bold hover:shadow-[0_0_32px_rgba(212,175,55,0.2)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
              <PlayCircle className="w-4 h-4" />
              Iniciar Partida
            </button>
          </Link>
        </motion.div>
      )}

      {/* Active / Finished match actions */}
      {(match.status === 'active' || (match.status === 'finished' && matchTeams.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col gap-3 items-center pb-4"
        >
          <Link to={`/match/${match.id}/draw`} className="w-full max-w-md">
            <button className="w-full h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-white hover:bg-white/[0.1] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
              <Users className="w-4 h-4" />
              Ver Times
            </button>
          </Link>
          <Link to={`/match/${match.id}/game`} className="w-full max-w-md">
            <button className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#e8c547] text-[#0B0B0F] text-sm font-bold hover:shadow-[0_0_32px_rgba(212,175,55,0.2)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer">
              {match.status === 'active' ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Ir para o Jogo
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  Ver Resultados
                </>
              )}
            </button>
          </Link>
        </motion.div>
      )}

      {/* Player Selector Modal */}
      <PlayerSelector
        isOpen={showPlayerSelector}
        onClose={() => setShowPlayerSelector(false)}
        onConfirm={handleAddPlayers}
        alreadyAddedIds={players.map(p => p.id)}
      />
    </div>
  );
};
