"""
Player Views

Views para gerenciamento de jogadores.
"""

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Player
from .serializers import (
    PlayerSerializer,
    PlayerCreateSerializer,
    PlayerListSerializer,
)


class PlayerViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de jogadores.
    
    GET /api/players/
        Lista todos os jogadores ativos
        
    POST /api/players/
        Cria novo jogador
        
    GET /api/players/{id}/
        Detalhes de um jogador
        
    PUT /api/players/{id}/
        Atualiza jogador
        
    DELETE /api/players/{id}/
        Remove jogador (soft delete - marca como inativo)
    """
    
    queryset = Player.objects.filter(is_active=True).order_by('name')
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Permite listagem pública, mas exige autenticação para modificações.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Retorna jogadores, com opção de incluir inativos."""
        queryset = Player.objects.all().order_by('name')
        
        # Por padrão, só retorna ativos
        include_inactive = self.request.query_params.get('include_inactive', 'false')
        if include_inactive.lower() != 'true':
            queryset = queryset.filter(is_active=True)
        
        # Filtro por skill_level
        skill = self.request.query_params.get('skill_level')
        if skill:
            queryset = queryset.filter(skill_level=skill)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PlayerListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PlayerCreateSerializer
        return PlayerSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/players/
        
        Lista todos os jogadores.
        
        Query Params:
        - include_inactive: incluir jogadores inativos (default: false)
        - skill_level: filtrar por nível (1, 2 ou 3)
        
        Response 200:
        {
            "success": true,
            "data": [
                {
                    "id": 1,
                    "name": "João Silva",
                    "nickname": "Joãozinho",
                    "displayName": "Joãozinho",
                    "skillLevel": 3,
                    "skillDisplay": "Bom",
                    "avatar": "JS"
                }
            ]
        }
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/players/{id}/
        
        Detalhes de um jogador.
        """
        instance = self.get_object()
        serializer = PlayerSerializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/players/
        
        Cria novo jogador.
        
        Request Body:
        {
            "name": "João Silva",
            "nickname": "Joãozinho",
            "skillLevel": 3
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        player = serializer.save()
        
        detail_serializer = PlayerSerializer(player)
        return Response({
            'success': True,
            'data': detail_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        PUT /api/players/{id}/
        
        Atualiza jogador.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        player = serializer.save()
        
        detail_serializer = PlayerSerializer(player)
        return Response({
            'success': True,
            'data': detail_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/players/{id}/
        
        Marca jogador como inativo (soft delete).
        """
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        
        return Response({
            'success': True,
            'message': f'Jogador {instance.display_name} desativado.'
        }, status=status.HTTP_200_OK)
