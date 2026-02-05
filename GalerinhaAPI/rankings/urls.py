"""
Rankings URLs
"""

from django.urls import path
from .views import RankingView, PlayerStatsView

urlpatterns = [
    path('', RankingView.as_view(), name='ranking'),
    path('player/<int:player_id>/', PlayerStatsView.as_view(), name='player-stats'),
]
