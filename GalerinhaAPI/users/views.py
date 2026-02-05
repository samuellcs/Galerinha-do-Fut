"""
User Views

Views para autenticação e gerenciamento de usuários.
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserDetailSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register
    
    Registra novo usuário e retorna tokens JWT.
    
    Request Body:
    {
        "name": "João Silva",
        "email": "joao@example.com",
        "password": "senha123",
        "password_confirm": "senha123"
    }
    
    Response 201:
    {
        "success": true,
        "data": {
            "user": {
                "id": 1,
                "name": "João Silva",
                "email": "joao@example.com",
                "avatar": "JS"
            },
            "tokens": {
                "access": "eyJ...",
                "refresh": "eyJ..."
            }
        }
    }
    """
    
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Gera tokens para o novo usuário
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    
    Autentica usuário e retorna tokens JWT.
    
    Request Body:
    {
        "username": "admin",
        "password": "admin"
    }
    
    Response 200:
    {
        "success": true,
        "data": {
            "user": {
                "id": 1,
                "name": "Admin",
                "email": "",
                "avatar": "AD"
            },
            "tokens": {
                "access": "eyJ...",
                "refresh": "eyJ..."
            }
        }
    }
    """
    
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        return Response({
            'success': True,
            'data': serializer.validated_data
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/auth/me
    
    Retorna dados do usuário autenticado.
    
    Response 200:
    {
        "success": true,
        "data": {
            "id": 1,
            "name": "João Silva",
            "email": "joao@example.com",
            "avatar": "JS",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    }
    
    PUT /api/auth/me
    
    Atualiza dados do usuário autenticado.
    
    Request Body:
    {
        "name": "João Silva Santos"
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def put(self, request):
        serializer = UserDetailSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password
    
    Altera senha do usuário autenticado.
    
    Request Body:
    {
        "current_password": "senhaAtual",
        "new_password": "novaSenha123",
        "new_password_confirm": "novaSenha123"
    }
    
    Response 200:
    {
        "success": true,
        "message": "Senha alterada com sucesso."
    }
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Atualiza senha
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({
            'success': True,
            'message': 'Senha alterada com sucesso.'
        })


class UserListView(generics.ListAPIView):
    """
    GET /api/auth/users
    
    Lista todos os usuários (jogadores) do sistema.
    Útil para selecionar jogadores em uma pelada.
    
    Query Params:
    - search: busca por nome ou email
    
    Response 200:
    {
        "success": true,
        "data": [
            {
                "id": 1,
                "name": "João Silva",
                "email": "joao@example.com",
                "avatar": "JS"
            },
            ...
        ]
    }
    """
    
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'email']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
