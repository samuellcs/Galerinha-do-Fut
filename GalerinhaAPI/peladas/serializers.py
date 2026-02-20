"""
Pelada Serializers

Serializers para CRUD de peladas e confirmação de presença.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Pelada, PeladaPlayer
from users.serializers import UserSerializer
from players.serializers import PlayerSerializer
from players.models import Player

User = get_user_model()


class PeladaPlayerSerializer(serializers.ModelSerializer):
    """
    Serializer para jogador confirmado em uma pelada.
    """
    
    player = PlayerSerializer(read_only=True)
    
    class Meta:
        model = PeladaPlayer
        fields = ['player', 'confirmed_at']


class PeladaListSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem de peladas.
    
    Response:
    {
        "id": 1,
        "name": "Pelada de Quarta",
        "date": "2024-01-15",
        "time": "19:00",
        "location": "Arena Soccer",
        "format": "5x5",
        "status": "open",
        "confirmedPlayerIds": [1, 2, 3],
        "confirmedCount": 3,
        "playersNeeded": 10,
        "createdBy": { ... }
    }
    """
    
    confirmed_player_ids = serializers.SerializerMethodField()
    confirmed_count = serializers.SerializerMethodField()
    players_needed = serializers.IntegerField(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Pelada
        fields = [
            'id', 'name', 'date', 'time', 'location', 'format', 'status',
            'confirmed_player_ids', 'confirmed_count', 'players_needed',
            'created_by', 'created_at'
        ]
    
    def get_confirmed_player_ids(self, obj) -> list:
        """Retorna lista de IDs dos jogadores confirmados."""
        return list(obj.players.values_list('id', flat=True))
    
    def get_confirmed_count(self, obj) -> int:
        """Retorna quantidade de jogadores confirmados."""
        return obj.players.count()


class PeladaDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detalhado para uma pelada específica.
    Inclui lista completa de jogadores confirmados.
    
    Response:
    {
        "id": 1,
        "name": "Pelada de Quarta",
        "date": "2024-01-15",
        "time": "19:00",
        "location": "Arena Soccer",
        "format": "5x5",
        "status": "open",
        "confirmedPlayers": [
            { "id": 1, "name": "João", "skillLevel": 3, ... },
            ...
        ],
        "confirmedCount": 3,
        "playersNeeded": 10,
        "teamSize": 5,
        "totalSkill": 15,
        "createdBy": { ... },
        "canDrawTeams": true
    }
    """
    
    confirmed_players = serializers.SerializerMethodField()
    confirmed_player_ids = serializers.SerializerMethodField()
    confirmed_count = serializers.SerializerMethodField()
    players_needed = serializers.IntegerField(read_only=True)
    team_size = serializers.IntegerField(read_only=True)
    created_by = UserSerializer(read_only=True)
    can_draw_teams = serializers.SerializerMethodField()
    
    class Meta:
        model = Pelada
        fields = [
            'id', 'name', 'date', 'time', 'location', 'format', 'status',
            'confirmed_players', 'confirmed_player_ids', 'confirmed_count',
            'players_needed', 'team_size',
            'created_by', 'can_draw_teams',
            'created_at', 'updated_at'
        ]
    
    def get_confirmed_players(self, obj) -> list:
        """Retorna lista de jogadores confirmados."""
        players = obj.players.all()
        return PlayerSerializer(players, many=True).data
    
    def get_confirmed_player_ids(self, obj) -> list:
        """Retorna lista de IDs dos jogadores confirmados."""
        return list(obj.players.values_list('id', flat=True))
    
    def get_confirmed_count(self, obj) -> int:
        """Retorna quantidade de jogadores confirmados."""
        return obj.players.count()
    
    def get_can_draw_teams(self, obj) -> bool:
        """Verifica se pode sortear times."""
        return obj.can_draw_teams()


class PeladaCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de pelada.
    
    Request:
    {
        "name": "Futebol de Quinta",
        "date": "2024-01-20",
        "time": "19:00",
        "location": "Arena Society",
        "format": "5x5"
    }
    """
    
    class Meta:
        model = Pelada
        fields = ['name', 'date', 'time', 'location', 'format']
    
    def validate_name(self, value):
        """Valida nome da pelada."""
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                'Nome deve ter pelo menos 3 caracteres.'
            )
        return value.strip()
    
    def validate_date(self, value):
        """Valida que a data não seja passada."""
        from datetime import date
        today = date.today()
        
        if value < today:
            raise serializers.ValidationError(
                'Não é possível criar pelada com data passada.'
            )
        
        # Valida que a data não seja muito futura (max 1 ano)
        from datetime import timedelta
        max_date = today + timedelta(days=365)
        if value > max_date:
            raise serializers.ValidationError(
                'Data muito distante. Máximo de 1 ano no futuro.'
            )
        
        return value
    
    def validate_time(self, value):
        """Valida formato de hora."""
        # O Django já valida o formato HH:MM
        # Podemos adicionar validações extras se necessário
        if value.hour < 6 or value.hour > 23:
            raise serializers.ValidationError(
                'Horário deve estar entre 06:00 e 23:59.'
            )
        return value
    
    def validate(self, attrs):
        """Valida combinação de data e hora."""
        from datetime import datetime, timezone
        import pytz
        
        date_val = attrs.get('date')
        time_val = attrs.get('time')
        
        if date_val and time_val:
            # Verifica se a data/hora já passou
            from datetime import date
            today = date.today()
            
            if date_val == today:
                # Se for hoje, valida que a hora não seja passada
                from datetime import datetime as dt
                now = dt.now().time()
                if time_val < now:
                    raise serializers.ValidationError({
                        'time': 'Horário já passou. Escolha um horário futuro.'
                    })
        
        return attrs
    
    def create(self, validated_data):
        """Cria pelada."""
        user = self.context['request'].user
        pelada = Pelada.objects.create(
            created_by=user,
            **validated_data
        )
        return pelada


class AddPlayerSerializer(serializers.Serializer):
    """
    Serializer para adicionar jogador a uma pelada.
    
    Request:
    {
        "player_id": 1
    }
    """
    player_id = serializers.IntegerField()
    
    def validate_player_id(self, value):
        """Valida que o jogador existe e está ativo."""
        try:
            player = Player.objects.get(id=value, is_active=True)
        except Player.DoesNotExist:
            raise serializers.ValidationError(
                'Jogador não encontrado ou está inativo.'
            )
        return value


class AddMultiplePlayersSerializer(serializers.Serializer):
    """
    Serializer para adicionar múltiplos jogadores a uma pelada.
    
    Request:
    {
        "player_ids": [1, 2, 3]
    }
    """
    player_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    
    def validate_player_ids(self, value):
        """Valida que todos os jogadores existem e estão ativos."""
        players = Player.objects.filter(id__in=value, is_active=True)
        if players.count() != len(value):
            found_ids = set(players.values_list('id', flat=True))
            missing = set(value) - found_ids
            raise serializers.ValidationError(
                f'Jogadores não encontrados ou inativos: {list(missing)}'
            )
        return value


class ConfirmPresenceSerializer(serializers.Serializer):
    """
    Serializer vazio para confirmação de presença.
    A lógica está na view.
    """
    pass
