"""
Ranking Views

Views para ranking global de jogadores.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from matches.models import Match, MatchStats, TeamPlayer

User = get_user_model()


class RankingView(APIView):
    """
    GET /api/ranking/
    
    Retorna ranking global de jogadores baseado em gols e assistências.
    
    Query Params:
    - limit: número máximo de jogadores (default: 50)
    - order_by: campo para ordenação (points, goals, assists) (default: points)
    
    Response 200:
    {
        "success": true,
        "data": {
            "ranking": [
                {
                    "playerId": 1,
                    "playerName": "João Silva",
                    "avatar": "JS",
                    "goals": 10,
                    "assists": 5,
                    "matchesPlayed": 8,
                    "points": 25
                },
                ...
            ],
            "totalPlayers": 10,
            "totalMatches": 5
        }
    }
    
    Cálculo de pontos:
    - Gol: 2 pontos
    - Assistência: 1 ponto
    """
    
    permission_classes = [IsAuthenticated]
    
    POINTS_PER_GOAL = 2
    POINTS_PER_ASSIST = 1
    
    def get(self, request):
        # Parâmetros
        limit = int(request.query_params.get('limit', 50))
        order_by = request.query_params.get('order_by', 'points')
        
        # Busca estatísticas agregadas por jogador
        ranking_data = self._calculate_ranking()
        
        # Ordena
        if order_by == 'goals':
            ranking_data.sort(key=lambda x: (-x['goals'], -x['points']))
        elif order_by == 'assists':
            ranking_data.sort(key=lambda x: (-x['assists'], -x['points']))
        else:  # points (default)
            ranking_data.sort(key=lambda x: (-x['points'], -x['goals']))
        
        # Limita
        ranking_data = ranking_data[:limit]
        
        # Total de partidas finalizadas
        total_matches = Match.objects.filter(status='finished').count()
        
        return Response({
            'success': True,
            'data': {
                'ranking': ranking_data,
                'totalPlayers': len(ranking_data),
                'totalMatches': total_matches
            }
        })
    
    def _calculate_ranking(self) -> list:
        """
        Calcula ranking agregando estatísticas de todos os jogadores.
        """
        # Busca todos os jogadores que participaram de partidas
        players_in_matches = TeamPlayer.objects.values_list(
            'player_id', flat=True
        ).distinct()
        
        ranking = []
        
        for player_id in players_in_matches:
            try:
                player = User.objects.get(id=player_id)
            except User.DoesNotExist:
                continue
            
            # Conta gols e assistências
            goals = MatchStats.objects.filter(
                player_id=player_id,
                stat_type='goal',
                match__status='finished'
            ).count()
            
            assists = MatchStats.objects.filter(
                player_id=player_id,
                stat_type='assist',
                match__status='finished'
            ).count()
            
            # Conta partidas jogadas (finalizadas)
            matches_played = TeamPlayer.objects.filter(
                player_id=player_id,
                team__match__status='finished'
            ).values('team__match').distinct().count()
            
            # Calcula pontos
            points = (goals * self.POINTS_PER_GOAL) + (assists * self.POINTS_PER_ASSIST)
            
            # Só inclui jogadores que participaram de pelo menos 1 partida
            if matches_played > 0:
                ranking.append({
                    'playerId': player.id,
                    'playerName': player.name,
                    'avatar': player.avatar,
                    'goals': goals,
                    'assists': assists,
                    'matchesPlayed': matches_played,
                    'points': points
                })
        
        return ranking


class PlayerStatsView(APIView):
    """
    GET /api/ranking/player/{id}/
    
    Retorna estatísticas detalhadas de um jogador específico.
    
    Response 200:
    {
        "success": true,
        "data": {
            "player": {
                "id": 1,
                "name": "João Silva",
                "avatar": "JS"
            },
            "stats": {
                "goals": 10,
                "assists": 5,
                "matchesPlayed": 8,
                "points": 25
            },
            "recentMatches": [...]
        }
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    POINTS_PER_GOAL = 2
    POINTS_PER_ASSIST = 1
    
    def get(self, request, player_id):
        try:
            player = User.objects.get(id=player_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'Jogador não encontrado.'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Estatísticas gerais
        goals = MatchStats.objects.filter(
            player=player,
            stat_type='goal',
            match__status='finished'
        ).count()
        
        assists = MatchStats.objects.filter(
            player=player,
            stat_type='assist',
            match__status='finished'
        ).count()
        
        matches_played = TeamPlayer.objects.filter(
            player=player,
            team__match__status='finished'
        ).values('team__match').distinct().count()
        
        points = (goals * self.POINTS_PER_GOAL) + (assists * self.POINTS_PER_ASSIST)
        
        # Últimas partidas
        recent_matches = self._get_recent_matches(player)
        
        return Response({
            'success': True,
            'data': {
                'player': {
                    'id': player.id,
                    'name': player.name,
                    'avatar': player.avatar
                },
                'stats': {
                    'goals': goals,
                    'assists': assists,
                    'matchesPlayed': matches_played,
                    'points': points
                },
                'recentMatches': recent_matches
            }
        })
    
    def _get_recent_matches(self, player, limit=5) -> list:
        """Retorna últimas partidas do jogador."""
        recent = TeamPlayer.objects.filter(
            player=player,
            team__match__status='finished'
        ).select_related(
            'team__match__pelada'
        ).order_by('-team__match__finished_at')[:limit]
        
        matches = []
        for tp in recent:
            match = tp.team.match
            
            # Stats do jogador nesta partida
            goals = MatchStats.objects.filter(
                match=match,
                player=player,
                stat_type='goal'
            ).count()
            
            assists = MatchStats.objects.filter(
                match=match,
                player=player,
                stat_type='assist'
            ).count()
            
            matches.append({
                'matchId': match.id,
                'peladaName': match.pelada.name,
                'date': match.pelada.date.isoformat(),
                'teamName': tp.team.name,
                'goals': goals,
                'assists': assists
            })
        
        return matches
