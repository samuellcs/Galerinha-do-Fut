"""
Matches Admin Configuration
"""

from django.contrib import admin
from .models import Match, Team, TeamPlayer, MatchStats


class TeamInline(admin.TabularInline):
    """Inline para times da partida."""
    model = Team
    extra = 0
    show_change_link = True


class MatchStatsInline(admin.TabularInline):
    """Inline para estatísticas da partida."""
    model = MatchStats
    extra = 0
    readonly_fields = ['created_at']


class TeamPlayerInline(admin.TabularInline):
    """Inline para jogadores do time."""
    model = TeamPlayer
    extra = 0


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    """Admin para Match."""
    
    list_display = ['id', 'pelada', 'status', 'started_at', 'finished_at']
    list_filter = ['status', 'started_at']
    search_fields = ['pelada__name']
    readonly_fields = ['started_at', 'finished_at']
    inlines = [TeamInline, MatchStatsInline]


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    """Admin para Team."""
    
    list_display = ['name', 'match', 'players_count']
    list_filter = ['match']
    search_fields = ['name', 'match__pelada__name']
    inlines = [TeamPlayerInline]
    
    def players_count(self, obj):
        return obj.players.count()
    players_count.short_description = 'Jogadores'


@admin.register(MatchStats)
class MatchStatsAdmin(admin.ModelAdmin):
    """Admin para MatchStats."""
    
    list_display = ['match', 'player', 'stat_type', 'created_at']
    list_filter = ['stat_type', 'created_at', 'match']
    search_fields = ['player__name', 'match__pelada__name']
    readonly_fields = ['created_at']
