"""
User Model - Custom User para GalerinhaDoFut

O usuário autenticado É o jogador.
Login simples via username (ex: admin).
Email é opcional.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model.

    - Usa username como login
    - name é o nome completo do jogador
    - email é opcional
    - avatar gerado automaticamente
    """

    # Mantém username
    username = models.CharField(
        'Username',
        max_length=150,
        unique=True,
        default='user',
        help_text='Nome de login (ex: admin)'
    )

    # Email opcional
    email = models.EmailField(
        'Email',
        blank=True,
        null=True
    )

    # Nome do jogador
    name = models.CharField('Nome completo', max_length=150, blank=True, default='')

    # Avatar (iniciais ou URL)
    avatar = models.CharField(
        'Avatar',
        max_length=255,
        blank=True,
        help_text='Iniciais do nome ou URL de imagem'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []  # Apenas username e senha são obrigatórios

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['name']

    def __str__(self):
        return self.name or self.username

    def save(self, *args, **kwargs):
        if not self.avatar:
            self.avatar = self._generate_avatar_initials()
        super().save(*args, **kwargs)

    def _generate_avatar_initials(self):
        if not self.name:
            return ''
        parts = self.name.strip().split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return parts[0][:2].upper()

    @property
    def first_name_display(self):
        return self.name.split()[0] if self.name else self.username
