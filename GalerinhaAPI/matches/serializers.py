"""
Match Serializers

Serializers para partidas, times e estatísticas.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Match, Team, TeamPlayer, MatchStats
from users.serializers import UserSerializer
from players.serializers import PlayerSerializer
from players.models import Player

User = get_user_model()


class TeamPlayerSerializer(serializers.ModelSerializer):
    """Serializer para jogador em um time."""
    
    player = PlayerSerializer(read_only=True)
    
    class Meta:
        model = TeamPlayer
        fields = ['player']


class TeamSerializer(serializers.ModelSerializer):
    """
    Serializer para time.
    
    Response:
    {
        "id": 1,
        "name": "Time Verde",
        "players": [
            { "id": 1, "name": "João", ... },
            ...
        ],
        "playerIds": [1, 2, 3],
        "goalsCount": 2
    }
    """
    
    players = serializers.SerializerMethodField()
    player_ids = serializers.SerializerMethodField()
    goals_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'player_ids', 'goals_count']
    
    def get_players(self, obj) -> list:
        """Retorna jogadores do time."""
        players = obj.players.all()
        return PlayerSerializer(players, many=True).data
    
    def get_player_ids(self, obj) -> list:
        """Retorna IDs dos jogadores."""
        return list(obj.players.values_list('id', flat=True))
    
    def get_goals_count(self, obj) -> int:
        """Retorna total de gols do time."""
        return obj.goals_count


class MatchStatsSerializer(serializers.ModelSerializer):
    """
    Serializer para estatística individual.
    
    Response:
    {
        "id": 1,
        "playerId": 1,
        "playerName": "João Silva",
        "type": "goal",
        "timestamp": "2024-01-15T19:30:00Z"
    }
    """
    
    player_id = serializers.IntegerField(source='player.id', read_only=True)
    player_name = serializers.CharField(source='player.display_name', read_only=True)
    type = serializers.CharField(source='stat_type')
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = MatchStats
        fields = ['id', 'player_id', 'player_name', 'type', 'timestamp']


class MatchListSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem de partidas.
    """
    
    pelada_name = serializers.CharField(source='pelada.name', read_only=True)
    teams_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = ['id', 'pelada_name', 'status', 'teams_count', 'started_at', 'finished_at']
    
    def get_teams_count(self, obj) -> int:
        return obj.teams.count()


class MatchDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detalhado para partida.
    
    Response:
    {
        "id": 1,
        "peladaId": 1,
        "peladaName": "Pelada de Quarta",
        "status": "active",
        "teams": [
            {
                "id": 1,
                "name": "Time Verde",
                "players": [...],
                "goalsCount": 2
            }
        ],
        "events": [
            {
                "id": 1,
                "playerId": 1,
                "playerName": "João",
                "type": "goal",
                "timestamp": "..."
            }
        ],
        "stats": {
            "1": { "goals": 2, "assists": 1 },
            ...
        },
        "startedAt": "...",
        "finishedAt": null
    }
    """
    
    pelada_id = serializers.IntegerField(source='pelada.id', read_only=True)
    pelada_name = serializers.CharField(source='pelada.name', read_only=True)
    teams = TeamSerializer(many=True, read_only=True)
    events = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(read_only=True)
    finished_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'pelada_id', 'pelada_name', 'status',
            'teams', 'events', 'stats',
            'started_at', 'finished_at'
        ]
    
    def get_events(self, obj) -> list:
        """Retorna eventos (gols e assistências) da partida."""
        stats = obj.stats.all().order_by('created_at')
        return MatchStatsSerializer(stats, many=True).data
    
    def get_stats(self, obj) -> dict:
        """
        Retorna estatísticas agregadas por jogador.
        Formato: { "playerId": { "goals": X, "assists": Y } }
        """
        stats = {}
        for stat in obj.stats.all():
            player_id = str(stat.player_id)
            if player_id not in stats:
                stats[player_id] = {'goals': 0, 'assists': 0}
            
            if stat.stat_type == 'goal':
                stats[player_id]['goals'] += 1
            elif stat.stat_type == 'assist':
                stats[player_id]['assists'] += 1
        
        return stats


class AddStatsSerializer(serializers.Serializer):
    """
    Serializer para adicionar estatística.
    
    Request:
    {
        "playerId": 1,
        "type": "goal"  // ou "assist"
    }
    """
    
    player_id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=['goal', 'assist'])
    
    def validate_player_id(self, value):
        """Valida se jogador existe e está na partida."""
        match = self.context.get('match')
        
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('Jogador não encontrado.')
        
        # Verifica se jogador está em algum time da partida
        player_in_match = TeamPlayer.objects.filter(
            team__match=match,
            player_id=value
        ).exists()
        
        if not player_in_match:
            raise serializers.ValidationError(
                'Este jogador não está participando desta partida.'
            )
        
        return value


class RemoveStatsSerializer(serializers.Serializer):
    """
    Serializer para remover estatística.
    
    Request:
    {
        "statId": 1
    }
    """
    
    stat_id = serializers.IntegerField()
    
    def validate_stat_id(self, value):
        """Valida se estatística existe."""
        match = self.context.get('match')
        
        if not MatchStats.objects.filter(id=value, match=match).exists():
            raise serializers.ValidationError('Estatística não encontrada.')
        
        return value
