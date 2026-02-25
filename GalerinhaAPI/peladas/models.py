"""
Pelada Models

Modelos para gerenciamento de peladas e confirmação de presença.
"""

from django.db import models
from django.conf import settings
from players.models import Player


class Pelada(models.Model):
    """
    Representa uma pelada (evento de futebol).
    
    Uma pelada pode ter múltiplas partidas (matches) ao longo do tempo,
    mas neste MVP simplificado, uma pelada gera uma partida única.
    
    Status:
    - open: aceita confirmações de presença
    - active: jogo em andamento (times sorteados)
    - finished: pelada finalizada
    
    Formatos:
    - 4x4: 8 jogadores (4 por time)
    - 5x5: 10 jogadores (5 por time)
    """
    
    STATUS_CHOICES = [
        ('open', 'Aberta'),
        ('active', 'Em andamento'),
        ('finished', 'Finalizada'),
    ]
    
    FORMAT_CHOICES = [
        ('4x4', '4 contra 4'),
        ('5x5', '5 contra 5'),
    ]
    
    # Informações básicas
    name = models.CharField('Nome', max_length=200)
    date = models.DateField('Data')
    time = models.TimeField('Horário')
    location = models.CharField('Local', max_length=300)
    
    # Formato da pelada
    format = models.CharField(
        'Formato',
        max_length=10,
        choices=FORMAT_CHOICES,
        default='5x5'
    )
    
    # Status
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='open'
    )
    
    # Criador da pelada
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='peladas_created',
        verbose_name='Criado por'
    )
    
    # Jogadores confirmados (usando model Player)
    players = models.ManyToManyField(
        Player,
        through='PeladaPlayer',
        related_name='peladas',
        verbose_name='Jogadores confirmados',
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Pelada'
        verbose_name_plural = 'Peladas'
        ordering = ['-date', '-time']
    
    def __str__(self):
        return f"{self.name} - {self.date}"
    
    @property
    def confirmed_count(self) -> int:
        """Retorna número de jogadores confirmados."""
        return self.players.count()
    
    @property
    def players_needed(self) -> int:
        """Retorna quantidade de jogadores necessários para o formato."""
        format_players = {'4x4': 8, '5x5': 10}
        return format_players.get(self.format, 10)
    
    @property
    def team_size(self) -> int:
        """Retorna tamanho de cada time."""
        format_sizes = {'4x4': 4, '5x5': 5}
        return format_sizes.get(self.format, 5)
    
    @property
    def is_open(self) -> bool:
        """Verifica se pelada ainda aceita confirmações."""
        return self.status == 'open'
    
    @property
    def is_active(self) -> bool:
        """Verifica se pelada está em andamento."""
        return self.status == 'active'
    
    @property
    def is_finished(self) -> bool:
        """Verifica se pelada foi finalizada."""
        return self.status == 'finished'
    
    def can_add_player(self, player) -> bool:
        """Verifica se pode adicionar jogador."""
        return self.is_open and not self.peladaplayer_set.filter(player=player).exists()
    
    def can_draw_teams(self) -> bool:
        """Verifica se pode sortear times (mínimo necessário para o formato)."""
        return not self.is_finished and self.confirmed_count >= self.players_needed


class PeladaPlayer(models.Model):
    """
    Tabela intermediária entre Pelada e Player (confirmação de presença).
    
    Registra quando o jogador foi confirmado na pelada.
    """
    
    pelada = models.ForeignKey(
        Pelada,
        on_delete=models.CASCADE,
        verbose_name='Pelada'
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        verbose_name='Jogador'
    )
    
    # Quando confirmou
    confirmed_at = models.DateTimeField('Confirmado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Jogador na Pelada'
        verbose_name_plural = 'Jogadores na Pelada'
        unique_together = ['pelada', 'player']
        ordering = ['confirmed_at']
    
    def __str__(self):
        return f"{self.player.display_name} em {self.pelada.name}"
