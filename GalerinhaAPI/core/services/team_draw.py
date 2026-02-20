"""
Team Draw Service

Serviço responsável pelo sorteio de times equilibrados.
Usa o peso/habilidade dos jogadores para balancear os times.

Pesos:
- 3 = Jogador bom
- 2 = Jogador médio
- 1 = Jogador ruim

Uso:
    players = list(pelada.players.all())
    service = TeamDrawService(players, num_teams=2, players_per_team=5)
    result = service.draw()
    
    # result['teams'] = times balanceados por peso total
    # result['substitutes'] = jogadores que ficam de próxima
"""

import random
from typing import List, Dict, Any, Optional


class TeamDrawService:
    """
    Serviço para sorteio de times equilibrados.
    
    Usa algoritmo greedy para distribuir jogadores de forma
    que os times fiquem com pesos totais similares.
    Jogadores excedentes ficam como reservas (de próxima).
    """
    
    DEFAULT_TEAM_NAMES = [
        'Time Verde',
        'Time Branco', 
        'Time Azul',
        'Time Vermelho',
        'Time Amarelo',
        'Time Preto',
    ]
    
    def __init__(
        self, 
        players: List[Any], 
        num_teams: int = 2,
        players_per_team: Optional[int] = None,
        team_names: Optional[List[str]] = None
    ):
        """
        Inicializa o serviço de sorteio.
        
        Args:
            players: Lista de jogadores (Player objects com skill_level)
            num_teams: Número de times a criar (default: 2)
            players_per_team: Jogadores por time (ex: 5 para 5x5). 
                             Se None, distribui todos igualmente.
            team_names: Nomes customizados para os times (opcional)
        """
        self.players = players
        self.num_teams = num_teams
        self.players_per_team = players_per_team
        self.team_names = team_names or self.DEFAULT_TEAM_NAMES[:num_teams]
        
        self._validate()
    
    def _validate(self):
        """Valida parâmetros do sorteio."""
        min_needed = self.num_teams * (self.players_per_team or 1)
        
        if self.players_per_team:
            if len(self.players) < min_needed:
                raise ValueError(
                    f"Número insuficiente de jogadores. "
                    f"Mínimo: {min_needed}, Atual: {len(self.players)}"
                )
        else:
            if len(self.players) < self.num_teams:
                raise ValueError(
                    f"Número insuficiente de jogadores. "
                    f"Mínimo: {self.num_teams}, Atual: {len(self.players)}"
                )
        
        if self.num_teams < 2:
            raise ValueError("Número mínimo de times é 2.")
        
        if self.num_teams > 6:
            raise ValueError("Número máximo de times é 6.")
        
        if len(self.team_names) < self.num_teams:
            raise ValueError(
                f"Número de nomes de times ({len(self.team_names)}) "
                f"menor que número de times ({self.num_teams})."
            )
    
    def _get_skill(self, player) -> int:
        """Obtém o skill_level do jogador."""
        return getattr(player, 'skill_level', 2)  # Default: médio
    
    def draw(self) -> Dict[str, Any]:
        """
        Executa o sorteio de times balanceado por peso.
        
        Algoritmo:
        1. Ordena jogadores por skill (maior primeiro)
        2. Se players_per_team definido, seleciona os melhores e distribui
        3. Para cada jogador, adiciona ao time com menor peso total
        4. Jogadores excedentes ficam como reservas
        
        Returns:
            Dict com 'teams' (lista de times) e 'substitutes' (reservas).
        """
        # Cria estrutura dos times
        teams = [
            {
                "name": self.team_names[i], 
                "players": [],
                "total_skill": 0
            }
            for i in range(self.num_teams)
        ]
        
        # Ordena jogadores por skill (maior primeiro) com shuffle nos de mesmo nível
        sorted_players = self._shuffle_and_sort_players()
        
        substitutes = []
        
        if self.players_per_team:
            # Total de jogadores que entram nos times
            total_in_teams = self.players_per_team * self.num_teams
            
            # Os melhores entram, o restante fica de próxima
            players_for_teams = sorted_players[:total_in_teams]
            substitutes = sorted_players[total_in_teams:]
            
            # Distribui usando algoritmo greedy
            for player in players_for_teams:
                skill = self._get_skill(player)
                
                # Encontra time com menor peso total que ainda não está cheio
                eligible_teams = [
                    t for t in teams 
                    if len(t["players"]) < self.players_per_team
                ]
                if not eligible_teams:
                    break
                    
                min_team = min(eligible_teams, key=lambda t: t["total_skill"])
                min_team["players"].append(player)
                min_team["total_skill"] += skill
        else:
            # Distribui todos igualmente (comportamento original)
            for player in sorted_players:
                skill = self._get_skill(player)
                min_team = min(teams, key=lambda t: t["total_skill"])
                min_team["players"].append(player)
                min_team["total_skill"] += skill
        
        return {
            "teams": teams,
            "substitutes": substitutes
        }
    
    def _shuffle_and_sort_players(self) -> List[Any]:
        """
        Embaralha jogadores e ordena por skill.
        
        Jogadores de mesmo skill são embaralhados para variedade.
        """
        players_copy = self.players.copy()
        random.shuffle(players_copy)  # Embaralha primeiro
        
        # Ordena por skill (maior primeiro), mantendo ordem aleatória nos iguais
        return sorted(
            players_copy, 
            key=lambda p: self._get_skill(p),
            reverse=True
        )
    
    def draw_simple(self) -> Dict[str, Any]:
        """
        Sorteio simples (aleatório), sem considerar peso.
        
        Útil quando não se quer balanceamento.
        """
        shuffled_players = self.players.copy()
        random.shuffle(shuffled_players)
        
        teams = [
            {"name": self.team_names[i], "players": [], "total_skill": 0}
            for i in range(self.num_teams)
        ]
        
        substitutes = []
        
        if self.players_per_team:
            total_in_teams = self.players_per_team * self.num_teams
            players_for_teams = shuffled_players[:total_in_teams]
            substitutes = shuffled_players[total_in_teams:]
        else:
            players_for_teams = shuffled_players
        
        for i, player in enumerate(players_for_teams):
            team_index = i % self.num_teams
            teams[team_index]["players"].append(player)
            teams[team_index]["total_skill"] += self._get_skill(player)
        
        return {
            "teams": teams,
            "substitutes": substitutes
        }
    
    def get_balance_info(self, teams: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Retorna informações sobre o balanceamento dos times.
        
        Args:
            teams: Lista de times gerada pelo draw()
            
        Returns:
            Dict com estatísticas de balanceamento.
        """
        skills = [t["total_skill"] for t in teams]
        
        return {
            "skills": skills,
            "max_diff": max(skills) - min(skills),
            "average": sum(skills) / len(skills) if skills else 0,
            "is_balanced": max(skills) - min(skills) <= 2  # Diferença max de 2 pontos
        }
