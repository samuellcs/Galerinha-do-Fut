"""
Peladas Admin Configuration
"""

from django.contrib import admin
from .models import Pelada, PeladaPlayer


class PeladaPlayerInline(admin.TabularInline):
    """Inline para jogadores confirmados."""
    model = PeladaPlayer
    extra = 1
    readonly_fields = ['confirmed_at']
    autocomplete_fields = ['player']


@admin.register(Pelada)
class PeladaAdmin(admin.ModelAdmin):
    """Admin para Pelada."""
    
    list_display = ['name', 'date', 'time', 'location', 'format', 'status', 'confirmed_count', 'players_needed', 'created_by']
    list_filter = ['status', 'format', 'date', 'created_at']
    search_fields = ['name', 'location', 'created_by__name']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PeladaPlayerInline]
    
    fieldsets = (
        (None, {'fields': ('name', 'date', 'time', 'location')}),
        ('Configuração', {'fields': ('format', 'status')}),
        ('Criação', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(PeladaPlayer)
class PeladaPlayerAdmin(admin.ModelAdmin):
    """Admin para PeladaPlayer."""
    
    list_display = ['player', 'pelada', 'player_skill', 'confirmed_at']
    list_filter = ['pelada', 'player__skill_level', 'confirmed_at']
    search_fields = ['player__name', 'player__nickname', 'pelada__name']
    autocomplete_fields = ['player', 'pelada']
    
    def player_skill(self, obj):
        """Exibe o nível de habilidade do jogador."""
        return f"⭐" * obj.player.skill_level
    player_skill.short_description = 'Habilidade'
