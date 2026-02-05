"""
Players Admin Configuration
"""

from django.contrib import admin
from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    """Admin para Jogadores."""
    
    list_display = ['name', 'nickname', 'skill_level', 'skill_display', 'is_active', 'created_at']
    list_filter = ['skill_level', 'is_active', 'created_at']
    search_fields = ['name', 'nickname']
    list_editable = ['skill_level', 'is_active']
    readonly_fields = ['avatar', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'nickname', 'avatar')
        }),
        ('Habilidade', {
            'fields': ('skill_level',),
            'description': 'Peso para balanceamento: 1=Ruim, 2=Médio, 3=Bom'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def skill_display(self, obj):
        """Exibe o nível de habilidade formatado."""
        icons = {1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐'}
        return f"{icons.get(obj.skill_level, '')} {obj.skill_display}"
    skill_display.short_description = 'Nível'
