"""
Pelada Views

Views para gerenciamento de peladas e confirmação de presença.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Pelada, PeladaPlayer
from .serializers import (
    PeladaListSerializer,
    PeladaDetailSerializer,
    PeladaCreateSerializer,
    AddPlayerSerializer,
    AddMultiplePlayersSerializer,
)
from core.services.team_draw import TeamDrawService
from matches.models import Match, Team, TeamPlayer
from players.models import Player


class PeladaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de peladas.
    
    GET /api/peladas/
        Lista todas as peladas
        
    POST /api/peladas/
        Cria nova pelada
        
    GET /api/peladas/{id}/
        Detalhes de uma pelada
        
    POST /api/peladas/{id}/confirm/
        Confirma/cancela presença na pelada
        
    POST /api/peladas/{id}/draw-teams/
        Sorteia times e cria partida
    """
    
    queryset = Pelada.objects.all().order_by('-date', '-time')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PeladaListSerializer
        elif self.action == 'create':
            return PeladaCreateSerializer
        return PeladaDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/peladas/
        
        Lista todas as peladas.
        
        Query Params:
        - status: filtra por status (open, active, finished)
        
        Response 200:
        {
            "success": true,
            "data": [
                {
                    "id": 1,
                    "name": "Pelada de Quarta",
                    "date": "2024-01-15",
                    "time": "19:00",
                    "location": "Arena Soccer",
                    "status": "open",
                    "confirmedPlayerIds": [1, 2, 3],
                    "confirmedCount": 3,
                    "createdBy": { ... }
                }
            ]
        }
        """
        queryset = self.get_queryset()
        
        # Filtro por status
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/peladas/{id}/
        
        Detalhes de uma pelada específica.
        
        Response 200:
        {
            "success": true,
            "data": {
                "id": 1,
                "name": "Pelada de Quarta",
                ...
                "confirmedPlayers": [...],
                "canDrawTeams": true,
                "userConfirmed": true
            }
        }
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/peladas/
        
        Cria nova pelada.
        O criador é automaticamente confirmado.
        
        Request Body:
        {
            "name": "Futebol de Quinta",
            "date": "2024-01-20",
            "time": "19:00",
            "location": "Arena Society"
        }
        
        Response 201:
        {
            "success": true,
            "data": { ... pelada criada ... }
        }
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pelada = serializer.save()
        
        # Retorna com serializer detalhado
        detail_serializer = PeladaDetailSerializer(
            pelada,
            context={'request': request}
        )
        
        return Response({
            'success': True,
            'data': detail_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        POST /api/peladas/{id}/confirm/
        
        DEPRECADO: Use /add-player/ ou /add-players/ para adicionar jogadores.
        Mantido para compatibilidade.
        """
        return Response({
            'success': False,
            'error': {
                'code': 'DEPRECATED',
                'message': 'Use /add-player/ ou /add-players/ para gerenciar jogadores.'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='add-player')
    def add_player(self, request, pk=None):
        """
        POST /api/peladas/{id}/add-player/
        
        Adiciona um jogador à pelada.
        
        Request Body:
        {
            "player_id": 1
        }
        
        Response 200:
        {
            "success": true,
            "message": "Jogador adicionado!",
            "data": {
                "pelada": { ... }
            }
        }
        """
        pelada = self.get_object()
        
        # Verifica se pelada está aberta
        if not pelada.is_open:
            return Response({
                'success': False,
                'error': {
                    'code': 'PELADA_NOT_OPEN',
                    'message': 'Esta pelada não está mais aceitando jogadores.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AddPlayerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        player_id = serializer.validated_data['player_id']
        player = Player.objects.get(id=player_id)
        
        # Verifica se jogador já está na pelada
        if pelada.peladaplayer_set.filter(player=player).exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'PLAYER_ALREADY_ADDED',
                    'message': f'Jogador {player.display_name} já está na pelada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Adiciona jogador
        PeladaPlayer.objects.create(pelada=pelada, player=player)
        
        # Retorna pelada atualizada
        detail_serializer = PeladaDetailSerializer(pelada, context={'request': request})
        
        return Response({
            'success': True,
            'message': f'Jogador {player.display_name} adicionado!',
            'data': {
                'pelada': detail_serializer.data
            }
        })
    
    @action(detail=True, methods=['post'], url_path='add-players')
    def add_players(self, request, pk=None):
        """
        POST /api/peladas/{id}/add-players/
        
        Adiciona múltiplos jogadores à pelada.
        
        Request Body:
        {
            "player_ids": [1, 2, 3]
        }
        
        Response 200:
        {
            "success": true,
            "message": "3 jogadores adicionados!",
            "data": {
                "added": ["João", "Maria", "Pedro"],
                "pelada": { ... }
            }
        }
        """
        pelada = self.get_object()
        
        # Verifica se pelada está aberta
        if not pelada.is_open:
            return Response({
                'success': False,
                'error': {
                    'code': 'PELADA_NOT_OPEN',
                    'message': 'Esta pelada não está mais aceitando jogadores.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AddMultiplePlayersSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        player_ids = serializer.validated_data['player_ids']
        players = Player.objects.filter(id__in=player_ids, is_active=True)
        
        # Filtra jogadores que já estão na pelada
        existing_ids = set(pelada.players.values_list('id', flat=True))
        new_players = [p for p in players if p.id not in existing_ids]
        
        # Adiciona os novos jogadores
        added_names = []
        for player in new_players:
            PeladaPlayer.objects.create(pelada=pelada, player=player)
            added_names.append(player.display_name)
        
        # Retorna pelada atualizada
        detail_serializer = PeladaDetailSerializer(pelada, context={'request': request})
        
        return Response({
            'success': True,
            'message': f'{len(added_names)} jogador(es) adicionado(s)!',
            'data': {
                'added': added_names,
                'pelada': detail_serializer.data
            }
        })
    
    @action(detail=True, methods=['post'], url_path='remove-player')
    def remove_player(self, request, pk=None):
        """
        POST /api/peladas/{id}/remove-player/
        
        Remove um jogador da pelada.
        
        Request Body:
        {
            "player_id": 1
        }
        """
        pelada = self.get_object()
        
        if not pelada.is_open:
            return Response({
                'success': False,
                'error': {
                    'code': 'PELADA_NOT_OPEN',
                    'message': 'Esta pelada não pode ser modificada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        player_id = request.data.get('player_id')
        if not player_id:
            return Response({
                'success': False,
                'error': {
                    'code': 'MISSING_PLAYER_ID',
                    'message': 'player_id é obrigatório.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pelada_player = PeladaPlayer.objects.get(pelada=pelada, player_id=player_id)
            player_name = pelada_player.player.display_name
            pelada_player.delete()
            
            detail_serializer = PeladaDetailSerializer(pelada, context={'request': request})
            
            return Response({
                'success': True,
                'message': f'Jogador {player_name} removido!',
                'data': {
                    'pelada': detail_serializer.data
                }
            })
        except PeladaPlayer.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'PLAYER_NOT_IN_PELADA',
                    'message': 'Jogador não está nesta pelada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='draw-teams')
    def draw_teams(self, request, pk=None):
        """
        POST /api/peladas/{id}/draw-teams/
        
        Sorteia times balanceados e cria uma partida (Match).
        Usa o peso dos jogadores para equilibrar os times.
        
        Request Body (opcional):
        {
            "numTeams": 2,  // default: 2
            "teamNames": ["Time Verde", "Time Branco"]  // opcional
        }
        
        Response 200:
        {
            "success": true,
            "message": "Times sorteados com sucesso!",
            "data": {
                "match": {
                    "id": 1,
                    "status": "active",
                    "teams": [
                        {
                            "id": 1,
                            "name": "Time Verde",
                            "players": [...],
                            "totalSkill": 12
                        },
                        ...
                    ]
                },
                "balanceInfo": {
                    "skills": [12, 11],
                    "maxDiff": 1,
                    "isBalanced": true
                },
                "pelada": { ... }
            }
        }
        """
        pelada = self.get_object()
        
        # Validações
        if not pelada.is_open:
            return Response({
                'success': False,
                'error': {
                    'code': 'PELADA_NOT_OPEN',
                    'message': 'Esta pelada não está aberta para sorteio.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not pelada.can_draw_teams():
            return Response({
                'success': False,
                'error': {
                    'code': 'INSUFFICIENT_PLAYERS',
                    'message': f'São necessários pelo menos {pelada.players_needed} jogadores para o formato {pelada.format}. Atualmente: {pelada.confirmed_count}.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parâmetros do sorteio
        num_teams = request.data.get('numTeams', 2)
        team_names = request.data.get('teamNames', None)
        
        # Executa sorteio balanceado
        confirmed_players = list(pelada.players.all())
        draw_service = TeamDrawService(confirmed_players, num_teams, team_names)
        teams_data = draw_service.draw()
        
        # Obtém informações de balanceamento
        balance_info = draw_service.get_balance_info(teams_data)
        
        # Cria Match
        match = Match.objects.create(
            pelada=pelada,
            status='active'
        )
        
        # Cria Teams e associa jogadores
        for team_info in teams_data:
            team = Team.objects.create(
                match=match,
                name=team_info['name']
            )
            for player in team_info['players']:
                TeamPlayer.objects.create(
                    team=team,
                    player=player
                )
        
        # Atualiza status da pelada
        pelada.status = 'active'
        pelada.save()
        
        # Serializa resposta
        from matches.serializers import MatchDetailSerializer
        match_serializer = MatchDetailSerializer(match, context={'request': request})
        pelada_serializer = PeladaDetailSerializer(pelada, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Times sorteados com sucesso!',
            'data': {
                'match': match_serializer.data,
                'balanceInfo': balance_info,
                'pelada': pelada_serializer.data
            }
        })
