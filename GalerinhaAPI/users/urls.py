"""
User URLs
"""

from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    MeView,
    ChangePasswordView,
    UserListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
]
