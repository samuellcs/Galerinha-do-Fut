"""
Ranking Serializers

Serializers para ranking de jogadores.
"""

from rest_framework import serializers


class PlayerRankingSerializer(serializers.Serializer):
    """
    Serializer para ranking de um jogador.
    
    Response:
    {
        "playerId": 1,
        "playerName": "João Silva",
        "avatar": "JS",
        "goals": 10,
        "assists": 5,
        "matchesPlayed": 8,
        "points": 25
    }
    """
    
    player_id = serializers.IntegerField()
    player_name = serializers.CharField()
    avatar = serializers.CharField()
    goals = serializers.IntegerField()
    assists = serializers.IntegerField()
    matches_played = serializers.IntegerField()
    points = serializers.IntegerField()


class RankingResponseSerializer(serializers.Serializer):
    """
    Serializer para resposta completa do ranking.
    
    Response:
    {
        "success": true,
        "data": {
            "ranking": [...],
            "totalPlayers": 10,
            "totalMatches": 5
        }
    }
    """
    
    ranking = PlayerRankingSerializer(many=True)
    total_players = serializers.IntegerField()
    total_matches = serializers.IntegerField()
