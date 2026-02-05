"""
Core Permissions

Permissões customizadas para a API.
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite edição apenas ao dono do objeto.
    Outros usuários podem apenas visualizar.
    """
    
    def has_object_permission(self, request, view, obj):
        # Leitura permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Escrita apenas para o dono
        return obj.created_by == request.user


class IsPeladaCreator(permissions.BasePermission):
    """
    Permite ações específicas apenas ao criador da pelada.
    """
    
    def has_object_permission(self, request, view, obj):
        # Verifica se o objeto é uma Pelada ou tem relação com Pelada
        pelada = getattr(obj, 'pelada', obj)
        return pelada.created_by == request.user


class IsMatchParticipant(permissions.BasePermission):
    """
    Permite ações apenas a participantes da partida.
    """
    
    def has_object_permission(self, request, view, obj):
        from matches.models import TeamPlayer
        
        match = getattr(obj, 'match', obj)
        return TeamPlayer.objects.filter(
            team__match=match,
            player=request.user
        ).exists()


class IsActiveMatch(permissions.BasePermission):
    """
    Permite ações apenas em partidas ativas.
    """
    
    message = 'Esta partida não está mais ativa.'
    
    def has_object_permission(self, request, view, obj):
        match = getattr(obj, 'match', obj)
        return match.is_active


class IsOpenPelada(permissions.BasePermission):
    """
    Permite ações apenas em peladas abertas.
    """
    
    message = 'Esta pelada não está mais aberta.'
    
    def has_object_permission(self, request, view, obj):
        pelada = getattr(obj, 'pelada', obj)
        return pelada.is_open
