"""
Match Models

Modelos para partidas, times e estatísticas de jogo.
"""

from django.db import models
from django.conf import settings
from players.models import Player


class Match(models.Model):
    """
    Representa uma partida de uma pelada.
    
    Status:
    - active: partida em andamento
    - finished: partida finalizada
    """
    
    STATUS_CHOICES = [
        ('active', 'Em andamento'),
        ('finished', 'Finalizada'),
    ]
    
    pelada = models.ForeignKey(
        'peladas.Pelada',
        on_delete=models.CASCADE,
        related_name='matches',
        verbose_name='Pelada'
    )
    
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # Timestamps
    started_at = models.DateTimeField('Iniciado em', auto_now_add=True)
    finished_at = models.DateTimeField('Finalizado em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Partida'
        verbose_name_plural = 'Partidas'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Partida de {self.pelada.name}"
    
    @property
    def is_active(self) -> bool:
        """Verifica se partida está em andamento."""
        return self.status == 'active'
    
    @property
    def is_finished(self) -> bool:
        """Verifica se partida foi finalizada."""
        return self.status == 'finished'
    
    def can_register_stats(self) -> bool:
        """Verifica se pode registrar estatísticas."""
        return self.is_active


class Team(models.Model):
    """
    Representa um time em uma partida.
    """
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='teams',
        verbose_name='Partida'
    )
    
    name = models.CharField('Nome do Time', max_length=100)
    
    # Jogadores do time (many-to-many through)
    players = models.ManyToManyField(
        Player,
        through='TeamPlayer',
        related_name='teams',
        verbose_name='Jogadores'
    )
    
    class Meta:
        verbose_name = 'Time'
        verbose_name_plural = 'Times'
    
    def __str__(self):
        return f"{self.name} ({self.match})"
    
    @property
    def total_skill(self) -> int:
        """Retorna soma total dos pesos do time."""
        return sum(p.skill_level for p in self.players.all())
    
    @property
    def goals_count(self) -> int:
        """Retorna total de gols do time."""
        return MatchStats.objects.filter(
            match=self.match,
            player__in=self.players.all(),
            stat_type='goal'
        ).count()


class TeamPlayer(models.Model):
    """
    Tabela intermediária entre Team e Player.
    """
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        verbose_name='Time'
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        verbose_name='Jogador'
    )
    
    class Meta:
        verbose_name = 'Jogador no Time'
        verbose_name_plural = 'Jogadores no Time'
        unique_together = ['team', 'player']
    
    def __str__(self):
        return f"{self.player.display_name} no {self.team.name}"


class MatchStats(models.Model):
    """
    Estatísticas de jogo (gols e assistências).
    
    Cada registro representa UM evento (1 gol ou 1 assistência).
    """
    
    STAT_TYPE_CHOICES = [
        ('goal', 'Gol'),
        ('assist', 'Assistência'),
    ]
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='stats',
        verbose_name='Partida'
    )
    
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name='match_stats',
        verbose_name='Jogador'
    )
    
    stat_type = models.CharField(
        'Tipo',
        max_length=20,
        choices=STAT_TYPE_CHOICES
    )
    
    # Timestamp do evento
    created_at = models.DateTimeField('Registrado em', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Estatística'
        verbose_name_plural = 'Estatísticas'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_stat_type_display()} - {self.player.display_name}"
