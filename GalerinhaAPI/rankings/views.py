"""
Ranking Views

Views para ranking global de jogadores.

Períodos suportados (query param ?period=):
  all_time          → todo o histórico
  year_YYYY         → ano específico (ex: year_2026)
  month_YYYY-MM     → mês específico (ex: month_2026-02)
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from matches.models import Match, MatchStats, TeamPlayer
from players.models import Player


class RankingView(APIView):
    """
    GET /api/ranking/?period=all_time&order_by=points

    Query Params:
    - period: all_time | year_YYYY | month_YYYY-MM
    - order_by: points | goals | assists | wins | win_pct
    - limit: int (default 50)
    """

    permission_classes = [IsAuthenticated]

    POINTS_PER_GOAL   = 3
    POINTS_PER_ASSIST = 1
    POINTS_PER_WIN    = 5

    def get(self, request):
        limit    = int(request.query_params.get('limit', 50))
        order_by = request.query_params.get('order_by', 'points')
        period   = request.query_params.get('period', 'all_time')

        match_filter  = self._build_match_filter(period)
        nested_filter = {f'team__match__{k}': v for k, v in match_filter.items()}

        ranking_data = self._calculate_ranking(match_filter, nested_filter)

        # Ordenação
        sort_keys = {
            'goals':   lambda x: (-x['goals'],   -x['points']),
            'assists': lambda x: (-x['assists'],  -x['points']),
            'wins':    lambda x: (-x['matchesWon'], -x['points']),
            'win_pct': lambda x: (-x['winPercentage'], -x['points']),
            'points':  lambda x: (-x['points'],  -x['goals']),
        }
        ranking_data.sort(key=sort_keys.get(order_by, sort_keys['points']))

        # Posição
        for i, entry in enumerate(ranking_data):
            entry['position'] = i + 1

        ranking_data = ranking_data[:limit]

        total_matches = Match.objects.filter(status='finished', **match_filter).count()

        return Response({
            'success': True,
            'data': {
                'ranking': ranking_data,
                'totalPlayers': len(ranking_data),
                'totalMatches': total_matches,
                'period': period,
            }
        })

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _build_match_filter(self, period: str) -> dict:
        """Converte string de período em filtro ORM para Match."""
        if period == 'all_time':
            return {}

        parts = period.split('_', 1)
        if len(parts) != 2:
            return {}

        kind, value = parts

        if kind == 'year':
            try:
                return {'finished_at__year': int(value)}
            except ValueError:
                return {}

        if kind == 'month':
            try:
                year_str, month_str = value.split('-')
                return {
                    'finished_at__year':  int(year_str),
                    'finished_at__month': int(month_str),
                }
            except (ValueError, AttributeError):
                return {}

        return {}

    def _calculate_ranking(self, match_filter: dict, nested_filter: dict) -> list:
        """Calcula estatísticas completas por jogador."""
        stats_filter = {f'match__{k}': v for k, v in match_filter.items()}

        player_ids = (
            TeamPlayer.objects
            .filter(team__match__status='finished', **nested_filter)
            .values_list('player_id', flat=True)
            .distinct()
        )

        ranking = []

        for player_id in player_ids:
            try:
                player = Player.objects.get(id=player_id)
            except Player.DoesNotExist:
                continue

            goals = MatchStats.objects.filter(
                player_id=player_id,
                stat_type='goal',
                match__status='finished',
                **stats_filter,
            ).count()

            assists = MatchStats.objects.filter(
                player_id=player_id,
                stat_type='assist',
                match__status='finished',
                **stats_filter,
            ).count()

            matches_played = (
                TeamPlayer.objects
                .filter(player_id=player_id, team__match__status='finished', **nested_filter)
                .values('team__match')
                .distinct()
                .count()
            )

            if matches_played == 0:
                continue

            peladas_played = (
                TeamPlayer.objects
                .filter(player_id=player_id, team__match__status='finished', **nested_filter)
                .values('team__match__pelada')
                .distinct()
                .count()
            )

            wins, losses, draws = self._get_match_results(player_id, nested_filter)

            win_pct = round(wins / matches_played * 100) if matches_played else 0
            p_per_match = round((goals + assists) / matches_played, 2)
            p_per_pelada = round((goals + assists) / peladas_played, 2) if peladas_played else 0
            points = goals * self.POINTS_PER_GOAL + assists * self.POINTS_PER_ASSIST + wins * self.POINTS_PER_WIN

            ranking.append({
                'playerId':               player.id,
                'playerName':             player.display_name,
                'fullName':               player.name,
                'avatar':                 player.avatar,
                'goals':                  goals,
                'assists':                assists,
                'matchesPlayed':          matches_played,
                'peladasPlayed':          peladas_played,
                'matchesWon':             wins,
                'matchesLost':            losses,
                'matchesDrawn':           draws,
                'winPercentage':          win_pct,
                'participationsPerMatch': p_per_match,
                'participationsPerPelada': p_per_pelada,
                'points':                points,
            })

        return ranking

    def _get_match_results(self, player_id: int, nested_filter: dict):
        """Calcula vitórias, derrotas e empates do jogador."""
        player_teams = (
            TeamPlayer.objects
            .filter(player_id=player_id, team__match__status='finished', **nested_filter)
            .select_related('team', 'team__match')
        )

        wins = losses = draws = 0

        for tp in player_teams:
            match    = tp.team.match
            my_team  = tp.team
            all_teams = list(match.teams.all())

            if len(all_teams) != 2:
                continue

            opponent = all_teams[0] if all_teams[1].id == my_team.id else all_teams[1]

            my_goals = MatchStats.objects.filter(
                match=match,
                player__in=my_team.players.all(),
                stat_type='goal',
            ).count()

            opp_goals = MatchStats.objects.filter(
                match=match,
                player__in=opponent.players.all(),
                stat_type='goal',
            ).count()

            if my_goals > opp_goals:
                wins += 1
            elif my_goals < opp_goals:
                losses += 1
            else:
                draws += 1

        return wins, losses, draws


class PlayerStatsView(APIView):
    """
    GET /api/ranking/player/{id}/?period=all_time

    Retorna estatísticas detalhadas de um jogador.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, player_id):
        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            return Response({
                'success': False,
                'error': {'code': 'NOT_FOUND', 'message': 'Jogador não encontrado.'}
            }, status=status.HTTP_404_NOT_FOUND)

        goals = MatchStats.objects.filter(
            player=player, stat_type='goal', match__status='finished'
        ).count()

        assists = MatchStats.objects.filter(
            player=player, stat_type='assist', match__status='finished'
        ).count()

        matches_played = (
            TeamPlayer.objects
            .filter(player=player, team__match__status='finished')
            .values('team__match').distinct().count()
        )

        points = goals * 3 + assists * 1

        return Response({
            'success': True,
            'data': {
                'player': {
                    'id':          player.id,
                    'name':        player.display_name,
                    'fullName':    player.name,
                    'avatar':      player.avatar,
                },
                'stats': {
                    'goals':         goals,
                    'assists':       assists,
                    'matchesPlayed': matches_played,
                    'points':        points,
                },
            }
        })
