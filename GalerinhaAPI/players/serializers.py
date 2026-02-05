"""
Player Serializers

Serializers para CRUD de jogadores.
"""

from rest_framework import serializers
from .models import Player


class PlayerSerializer(serializers.ModelSerializer):
    """
    Serializer básico para exibição de jogador.
    Usado em listagens e como nested em outros serializers.
    
    Response:
    {
        "id": 1,
        "name": "João Silva",
        "nickname": "Joãozinho",
        "displayName": "Joãozinho",
        "skillLevel": 3,
        "skillDisplay": "Bom",
        "avatar": "JS"
    }
    """
    
    displayName = serializers.CharField(source='display_name', read_only=True)
    skillLevel = serializers.IntegerField(source='skill_level')
    skillDisplay = serializers.CharField(source='skill_display', read_only=True)
    
    class Meta:
        model = Player
        fields = [
            'id', 'name', 'nickname', 'displayName',
            'skillLevel', 'skillDisplay', 'avatar', 'is_active'
        ]
        read_only_fields = ['id', 'avatar', 'displayName', 'skillDisplay']


class PlayerCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação/edição de jogador.
    
    Request Body:
    {
        "name": "João Silva",
        "nickname": "Joãozinho",
        "skillLevel": 3
    }
    """
    
    skillLevel = serializers.IntegerField(source='skill_level')
    
    class Meta:
        model = Player
        fields = ['id', 'name', 'nickname', 'skillLevel', 'is_active']
    
    def validate_skillLevel(self, value):
        """Valida que o peso está entre 1 e 3."""
        if value not in [1, 2, 3]:
            raise serializers.ValidationError(
                "Peso deve ser 1 (Ruim), 2 (Médio) ou 3 (Bom)."
            )
        return value


class PlayerListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listagem.
    """
    
    displayName = serializers.CharField(source='display_name', read_only=True)
    skillLevel = serializers.IntegerField(source='skill_level')
    skillDisplay = serializers.CharField(source='skill_display', read_only=True)
    
    class Meta:
        model = Player
        fields = [
            'id', 'name', 'nickname', 'displayName',
            'skillLevel', 'skillDisplay', 'avatar'
        ]
