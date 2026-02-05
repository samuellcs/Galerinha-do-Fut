"""
Player Model - Jogadores da Pelada

Jogadores com nome, apelido e peso/habilidade.
O peso é usado para balanceamento no sorteio de times.
"""

from django.db import models


class Player(models.Model):
    """
    Representa um jogador da pelada.
    
    Peso (skill_level):
    - 3 = Jogador bom
    - 2 = Jogador médio  
    - 1 = Jogador ruim
    
    O peso é usado pelo TeamDrawService para sortear times equilibrados.
    """
    
    SKILL_CHOICES = [
        (1, 'Ruim'),
        (2, 'Médio'),
        (3, 'Bom'),
    ]
    
    # Informações básicas
    name = models.CharField(
        'Nome',
        max_length=150,
        help_text='Nome completo do jogador'
    )
    
    nickname = models.CharField(
        'Apelido',
        max_length=50,
        blank=True,
        default='',
        help_text='Apelido do jogador (opcional)'
    )
    
    # Peso/Habilidade para balanceamento
    skill_level = models.IntegerField(
        'Peso/Habilidade',
        choices=SKILL_CHOICES,
        default=2,
        help_text='Nível de habilidade: 1=Ruim, 2=Médio, 3=Bom'
    )
    
    # Avatar (iniciais)
    avatar = models.CharField(
        'Avatar',
        max_length=10,
        blank=True,
        help_text='Iniciais do nome para avatar'
    )
    
    # Ativo ou não
    is_active = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Jogadores inativos não aparecem para seleção'
    )
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Jogador'
        verbose_name_plural = 'Jogadores'
        ordering = ['name']
    
    def __str__(self):
        if self.nickname:
            return f"{self.nickname} ({self.name})"
        return self.name
    
    @property
    def display_name(self):
        """Retorna apelido se existir, senão o nome."""
        return self.nickname if self.nickname else self.name
    
    @property
    def skill_display(self):
        """Retorna descrição do nível de habilidade."""
        skill_map = {1: 'Ruim', 2: 'Médio', 3: 'Bom'}
        return skill_map.get(self.skill_level, 'Desconhecido')
    
    def save(self, *args, **kwargs):
        if not self.avatar:
            self.avatar = self._generate_avatar_initials()
        super().save(*args, **kwargs)
    
    def _generate_avatar_initials(self):
        """Gera iniciais para o avatar baseado no nome."""
        name_to_use = self.nickname if self.nickname else self.name
        if not name_to_use:
            return ''
        parts = name_to_use.strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return parts[0][:2].upper() if parts else ''
