"""
Management command para criar jogadores de exemplo com pesos equilibrados.

Uso:
    python manage.py seed_players
"""

from django.core.management.base import BaseCommand
from players.models import Player


class Command(BaseCommand):
    help = 'Cria jogadores de exemplo com diferentes níveis de habilidade'

    def handle(self, *args, **options):
        # Lista de jogadores com nome, apelido e peso
        jogadores = [
            # Peso 3 - Jogadores Bons
            {'name': 'Carlos Eduardo Silva', 'nickname': 'Carlão', 'skill_level': 3},
            {'name': 'Rafael Almeida', 'nickname': 'Rafa', 'skill_level': 3},
            {'name': 'Lucas Oliveira', 'nickname': 'Lukinha', 'skill_level': 3},
            {'name': 'Gabriel Santos', 'nickname': 'Gabigol', 'skill_level': 3},
            
            # Peso 2 - Jogadores Médios
            {'name': 'João Pedro Costa', 'nickname': 'JP', 'skill_level': 2},
            {'name': 'Marcos Vinícius', 'nickname': 'Marcão', 'skill_level': 2},
            {'name': 'Felipe Rodrigues', 'nickname': 'Felipão', 'skill_level': 2},
            {'name': 'Bruno Ferreira', 'nickname': 'Bruninho', 'skill_level': 2},
            {'name': 'André Souza', 'nickname': 'Dedé', 'skill_level': 2},
            {'name': 'Pedro Henrique', 'nickname': 'PH', 'skill_level': 2},
            
            # Peso 1 - Jogadores Ruins
            {'name': 'Thiago Nascimento', 'nickname': 'Tiaguinho', 'skill_level': 1},
            {'name': 'Diego Martins', 'nickname': 'Diegão', 'skill_level': 1},
            {'name': 'Ricardo Lima', 'nickname': 'Ricardinho', 'skill_level': 1},
            {'name': 'Gustavo Pereira', 'nickname': 'Guga', 'skill_level': 1},
        ]

        created_count = 0
        updated_count = 0

        for jogador in jogadores:
            player, created = Player.objects.update_or_create(
                name=jogador['name'],
                defaults={
                    'nickname': jogador['nickname'],
                    'skill_level': jogador['skill_level'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Criado: {player.display_name} (Peso {player.skill_level} - {player.skill_display})"
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"↻ Atualizado: {player.display_name} (Peso {player.skill_level} - {player.skill_display})"
                    )
                )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Total: {created_count} criados, {updated_count} atualizados'))
        self.stdout.write('')
        
        # Resumo por nível
        self.stdout.write('Resumo por nível de habilidade:')
        for level, label in [(3, 'Bons'), (2, 'Médios'), (1, 'Ruins')]:
            count = Player.objects.filter(skill_level=level, is_active=True).count()
            self.stdout.write(f'  ⭐{"⭐" * (level-1)} Peso {level} ({label}): {count} jogadores')
