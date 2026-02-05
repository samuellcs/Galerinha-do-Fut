import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PlayerSelector } from '../components/PlayerSelector';
import { ChevronLeft, MapPin, Clock, Calendar, UserPlus, Users, PlayCircle, Trophy, UserCog, X } from 'lucide-react';
import { motion } from 'motion/react';

const API_BASE = 'http://192.168.0.52:8006';

interface PeladaPlayer {
  id: number;
  name: string;
  displayName?: string;
  display_name?: string;
  avatar?: string;
}

interface PeladaDetail {
  id: number;
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  status?: string;
  confirmed_players?: PeladaPlayer[];
  confirmedPlayers?: PeladaPlayer[];
}

export const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { matches, users, currentUser, generateTeams, teams, loadPeladasFromApi } = useApp();
  const navigate = useNavigate();
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [peladaDetail, setPeladaDetail] = useState<PeladaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);

  const match = matches.find(m => m.id === id);
  const matchTeams = teams.filter(t => t.matchId === id);

  // Usar peladaDetail quando a pelada ainda não está em matches (ex.: após criar ou link direto)
  const displayMatch = useMemo(() => {
    if (match) return match;
    if (!peladaDetail || !peladaDetail.name) return null;
    const status = peladaDetail.status === 'open' || peladaDetail.status === 'active' || peladaDetail.status === 'finished'
      ? peladaDetail.status
      : 'open';
    return {
      id: String(peladaDetail.id),
      name: peladaDetail.name,
      date: peladaDetail.date ?? '',
      time: peladaDetail.time ?? '',
      location: peladaDetail.location ?? '',
      status,
      confirmedPlayerIds: []
    };
  }, [match, peladaDetail]);

  // Se a URL tem id antigo (ex: m3), atualiza lista da API e redireciona para o id numérico da mesma pelada
  useEffect(() => {
    if (id == null || match == null || /^\d+$/.test(String(id))) return;
    let cancelled = false;
    (async () => {
      const list = await loadPeladasFromApi();
      if (cancelled || !list) return;
      const found = list.find(m => m.name === match.name);
      if (found) {
        navigate(`/match/${found.id}`, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [id, match?.name, navigate, loadPeladasFromApi]);

  // Buscar detalhe da pelada (com jogadores confirmados) quando o id for numérico
  useEffect(() => {
    if (id == null || !/^\d+$/.test(String(id))) {
      setPeladaDetail(null);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    let cancelled = false;
    const token = localStorage.getItem('access_token');
    if (!token) {
      setDetailLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/peladas/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data?.success && data?.data) {
          setPeladaDetail(data.data);
          loadPeladasFromApi();
        } else {
          setPeladaDetail(null);
        }
      })
      .catch(() => { if (!cancelled) setPeladaDetail(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [id, loadPeladasFromApi]);

  // #region agent log
  useEffect(() => {
    if (id == null) return;
    const isNumericId = /^\d+$/.test(String(id));
    fetch('http://127.0.0.1:7243/ingest/e1d88f39-c059-4d97-9c63-9272de5c0394',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchDetailPage.tsx:params',message:'Match detail params',data:{id, matchId: match?.id, isNumericId, matchesCount: matches.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  }, [id, match?.id, matches.length]);
  // #endregion

  const confirmedPlayers = useMemo(() => {
    if (!peladaDetail) return [];
    const list = peladaDetail.confirmed_players ?? peladaDetail.confirmedPlayers ?? [];
    return list.map(p => ({
      id: String(p.id),
      name: p.displayName ?? p.display_name ?? p.name,
      avatar: p.avatar ?? (p.name || '').slice(0, 2).toUpperCase()
    }));
  }, [peladaDetail]);

  const isAdmin = currentUser?.id === 'u1'; // TODO: Check if current user is admin

  if (detailLoading && !displayMatch) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Carregando pelada...
      </div>
    );
  }
  if (!displayMatch) {
    return (
      <div className="text-center py-12 text-gray-600">
        Pelada não encontrada.
      </div>
    );
  }

  const handleDrawTeams = () => {
    generateTeams(displayMatch.id);
    navigate(`/match/${displayMatch.id}/draw`);
  };

  const handleAddPlayers = async (playerIds: number[]) => {
    const url = `${API_BASE}/api/peladas/${id}/add-players/`;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e1d88f39-c059-4d97-9c63-9272de5c0394',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchDetailPage.tsx:handleAddPlayers:entry',message:'Add players called',data:{id, url, playerIdsCount: playerIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    if (id == null || !/^\d+$/.test(String(id))) {
      alert('Esta pelada não está sincronizada com o servidor. Acesse a lista de peladas para ver as peladas disponíveis.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ player_ids: playerIds })
      });

      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e1d88f39-c059-4d97-9c63-9272de5c0394',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchDetailPage.tsx:handleAddPlayers:response',message:'Add players response',data:{status: response.status, ok: response.ok, success: data?.success, errorMessage: data?.error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      if (data.success) {
        if (data.data?.pelada) setPeladaDetail(data.data.pelada);
        loadPeladasFromApi();
        setShowPlayerSelector(false);
      } else {
        alert(data.error?.message || 'Erro ao adicionar jogadores');
      }
    } catch (error) {
      console.error('Erro ao adicionar jogadores:', error);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e1d88f39-c059-4d97-9c63-9272de5c0394',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchDetailPage.tsx:handleAddPlayers:catch',message:'Add players fetch error',data:{error: String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      alert('Erro ao adicionar jogadores');
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm('Deseja remover este jogador?')) return;
    if (id == null || !/^\d+$/.test(String(id))) {
      alert('Esta pelada não está sincronizada com o servidor.');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/peladas/${id}/remove-player/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ player_id: playerId })
      });

      const data = await response.json();
      if (data.success) {
        if (data.data?.pelada) setPeladaDetail(data.data.pelada);
        loadPeladasFromApi();
      } else {
        alert(data.error?.message || 'Erro ao remover jogador');
      }
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
      alert('Erro ao remover jogador');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/home">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate">{displayMatch.name}</h1>
      </div>

      {/* Match Header Info */}
      <Card className="bg-gradient-to-br from-[#1E7F43] to-[#3FB984] text-white border-none">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 opacity-90 mb-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(displayMatch.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2 opacity-90 mb-1">
                <Clock className="w-4 h-4" />
                <span>{displayMatch.time}</span>
              </div>
              <div className="flex items-center gap-2 opacity-90">
                <MapPin className="w-4 h-4" />
                <span>{displayMatch.location}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-semibold border border-white/20">
              {displayMatch.status === 'open' ? 'Aberta' : displayMatch.status === 'active' ? 'Em Jogo' : 'Finalizada'}
            </div>
          </div>
        </div>
      </Card>

      {/* Player Selection */}
      {displayMatch.status === 'open' && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-green-900 flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                Adicionar Jogadores
              </h3>
              <p className="text-sm text-green-700">Escolha os jogadores confirmados para esta pelada</p>
            </div>
            <Button 
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/e1d88f39-c059-4d97-9c63-9272de5c0394',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MatchDetailPage.tsx:openSelector',message:'Opening player selector',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
                // #endregion
                setShowPlayerSelector(true);
              }}
              variant="primary"
              className="w-full sm:w-auto shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Escolher Jogadores
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmed Players List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Jogadores Confirmados
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {confirmedPlayers.length}
            </span>
          </h2>
        </div>

        {confirmedPlayers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {confirmedPlayers.map((player) => (
              <motion.div 
                key={player.id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm group relative"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                  {player.avatar}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-medium text-sm truncate">{player.name}</p>
                  <p className="text-xs text-gray-400 truncate">Confirmado</p>
                </div>
                {isAdmin && displayMatch.status === 'open' && (
                  <button
                    onClick={() => handleRemovePlayer(String(player.id))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Ninguém confirmou ainda. {isAdmin && 'Adicione os primeiros jogadores!'}
          </div>
        )}
      </div>

      {/* Admin / Action Buttons */}
      <div className="pt-4 pb-20">
        {displayMatch.status === 'open' && confirmedPlayers.length >= 2 && (
          <Button onClick={handleDrawTeams} size="lg" className="w-full shadow-lg shadow-green-200">
            <Users className="w-5 h-5" /> Sortear Times
          </Button>
        )}

        {(displayMatch.status === 'active' || (displayMatch.status === 'finished' && matchTeams.length > 0)) && (
           <div className="grid gap-3">
             <Link to={`/match/${displayMatch.id}/draw`}>
               <Button variant="secondary" className="w-full">
                 <Users className="w-5 h-5" /> Ver Times
               </Button>
             </Link>
             <Link to={`/match/${displayMatch.id}/game`}>
               <Button size="lg" className="w-full shadow-lg shadow-green-200">
                 {displayMatch.status === 'active' ? (
                   <>
                     <PlayCircle className="w-5 h-5" /> Ir para o Jogo
                   </>
                 ) : (
                   <>
                     <Trophy className="w-5 h-5" /> Ver Resultados
                   </>
                 )}
               </Button>
             </Link>
           </div>
        )}
      </div>

      {/* Player Selector Modal */}
      <PlayerSelector
        isOpen={showPlayerSelector}
        onClose={() => setShowPlayerSelector(false)}
        onConfirm={handleAddPlayers}
        alreadyAddedIds={confirmedPlayers.map(p => Number(p.id))} // TODO: Fix this mapping
      />
    </div>
  );
};
