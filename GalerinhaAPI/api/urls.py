"""
URL Configuration for GalerinhaAPI

Todos os endpoints da API são prefixados com /api/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include([
        # Auth endpoints
        path('auth/', include('users.urls')),
        
        # Players endpoints
        path('players/', include('players.urls')),
        
        # Peladas endpoints  
        path('peladas/', include('peladas.urls')),
        
        # Matches endpoints
        path('matches/', include('matches.urls')),
        
        # Rankings endpoints
        path('ranking/', include('rankings.urls')),
        
        # Token refresh
        path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
]
