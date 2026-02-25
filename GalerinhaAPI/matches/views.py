"""
Match Views

Views para gerenciamento de partidas e estatísticas.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Match, MatchStats
from .serializers import (
    MatchListSerializer,
    MatchDetailSerializer,
    AddStatsSerializer,
    RemoveStatsSerializer,
    MatchStatsSerializer,
)

User = get_user_model()


class MatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para partidas.
    
    GET /api/matches/
        Lista todas as partidas
        
    GET /api/matches/{id}/
        Detalhes de uma partida
        
    POST /api/matches/{id}/stats/
        Adiciona estatística (gol ou assistência)
        
    DELETE /api/matches/{id}/stats/
        Remove estatística
        
    POST /api/matches/{id}/finish/
        Finaliza a partida
    """
    
    queryset = Match.objects.all().order_by('-started_at')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        return MatchDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        GET /api/matches/
        
        Lista todas as partidas.
        
        Query Params:
        - status: filtra por status (active, finished)
        - pelada: filtra por pelada_id
        
        Response 200:
        {
            "success": true,
            "data": [...]
        }
        """
        queryset = self.get_queryset()
        
        # Filtros
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        pelada_filter = request.query_params.get('pelada')
        if pelada_filter:
            queryset = queryset.filter(pelada_id=pelada_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/matches/{id}/
        
        Detalhes de uma partida.
        
        Response 200:
        {
            "success": true,
            "data": { ... partida com times e stats ... }
        }
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post', 'delete'])
    def stats(self, request, pk=None):
        """
        POST /api/matches/{id}/stats/
        
        Adiciona estatística (gol ou assistência).
        
        Request Body:
        {
            "playerId": 1,
            "type": "goal"
        }
        
        Response 200:
        {
            "success": true,
            "message": "Gol registrado!",
            "data": {
                "stat": { ... },
                "match": { ... }
            }
        }
        
        DELETE /api/matches/{id}/stats/
        
        Remove estatística.
        
        Request Body:
        {
            "statId": 1
        }
        """
        match = self.get_object()
        
        # Validação: partida deve estar ativa
        if not match.can_register_stats():
            return Response({
                'success': False,
                'error': {
                    'code': 'MATCH_NOT_ACTIVE',
                    'message': 'Não é possível alterar estatísticas de uma partida finalizada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if request.method == 'POST':
            return self._add_stat(request, match)
        else:  # DELETE
            return self._remove_stat(request, match)
    
    def _add_stat(self, request, match):
        """Adiciona estatística."""
        serializer = AddStatsSerializer(
            data=request.data,
            context={'match': match, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Cria estatística
        stat = MatchStats.objects.create(
            match=match,
            player_id=serializer.validated_data['player_id'],
            stat_type=serializer.validated_data['type']
        )
        
        # Mensagem apropriada
        message = 'Gol registrado!' if stat.stat_type == 'goal' else 'Assistência registrada!'
        
        # Retorna partida atualizada
        match_serializer = MatchDetailSerializer(match, context={'request': request})
        
        return Response({
            'success': True,
            'message': message,
            'data': {
                'stat': MatchStatsSerializer(stat).data,
                'match': match_serializer.data
            }
        })
    
    def _remove_stat(self, request, match):
        """Remove estatística."""
        serializer = RemoveStatsSerializer(
            data=request.data,
            context={'match': match, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Remove estatística
        stat = MatchStats.objects.get(id=serializer.validated_data['stat_id'])
        stat_type = stat.stat_type
        stat.delete()
        
        # Mensagem apropriada
        message = 'Gol removido.' if stat_type == 'goal' else 'Assistência removida.'
        
        # Retorna partida atualizada
        match_serializer = MatchDetailSerializer(match, context={'request': request})
        
        return Response({
            'success': True,
            'message': message,
            'data': {
                'match': match_serializer.data
            }
        })
    
    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        """
        POST /api/matches/{id}/finish/
        
        Finaliza a partida.
        
        Response 200:
        {
            "success": true,
            "message": "Partida finalizada!",
            "data": { ... partida finalizada ... }
        }
        """
        match = self.get_object()
        
        # Validação
        if match.is_finished:
            return Response({
                'success': False,
                'error': {
                    'code': 'MATCH_ALREADY_FINISHED',
                    'message': 'Esta partida já foi finalizada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Finaliza partida (pelada continua ativa para novas rodadas)
        match.status = 'finished'
        match.finished_at = timezone.now()
        match.save()
        
        serializer = MatchDetailSerializer(match, context={'request': request})
        
        return Response({
            'success': True,
            'message': 'Partida finalizada!',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        POST /api/matches/{id}/start/
        
        Inicia a partida (caso tenha sido pausada ou precise reativar).
        Normalmente a partida já inicia ativa após o sorteio.
        
        Response 200:
        {
            "success": true,
            "message": "Partida iniciada!",
            "data": { ... }
        }
        """
        match = self.get_object()
        
        if match.is_finished:
            return Response({
                'success': False,
                'error': {
                    'code': 'MATCH_ALREADY_FINISHED',
                    'message': 'Não é possível reiniciar uma partida finalizada.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if match.is_active:
            return Response({
                'success': True,
                'message': 'Partida já está em andamento.',
                'data': MatchDetailSerializer(match, context={'request': request}).data
            })
        
        match.status = 'active'
        match.save()
        
        return Response({
            'success': True,
            'message': 'Partida iniciada!',
            'data': MatchDetailSerializer(match, context={'request': request}).data
        })
