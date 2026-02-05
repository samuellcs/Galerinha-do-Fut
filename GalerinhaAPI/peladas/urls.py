"""
Peladas URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PeladaViewSet

router = DefaultRouter()
router.register(r'', PeladaViewSet, basename='pelada')

urlpatterns = [
    path('', include(router.urls)),
]
