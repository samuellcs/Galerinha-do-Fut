"""
User Serializers

Serializers para registro, login e perfil de usuário.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer básico para exibição de usuário.
    Usado em listagens e como nested em outros serializers.
    
    Response:
    {
        "id": 1,
        "name": "João Silva",
        "email": "joao@example.com",
        "avatar": "JS"
    }
    """
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar']
        read_only_fields = ['id', 'avatar']


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detalhado para perfil do usuário autenticado.
    Inclui timestamps e informações adicionais.
    """
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar', 'created_at', 'updated_at']
        read_only_fields = ['id', 'avatar', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de novo usuário.
    
    Request:
    {
        "name": "João Silva",
        "email": "joao@example.com",
        "password": "senha123",
        "password_confirm": "senha123"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "user": { ... },
            "tokens": {
                "access": "...",
                "refresh": "..."
            }
        }
    }
    """
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'password_confirm']
    
    def validate_email(self, value):
        """Valida se email já existe."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Este email já está cadastrado.')
        return value.lower()
    
    def validate(self, attrs):
        """Valida se senhas conferem."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'As senhas não conferem.'
            })
        return attrs
    
    def create(self, validated_data):
        """Cria novo usuário."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer customizado para login.
    Adiciona dados do usuário na resposta do token.
    
    Request:
    {
        "username": "admin",
        "password": "admin"
    }
    
    Response:
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
                "access": "...",
                "refresh": "..."
            }
        }
    }
    """
    
    username_field = 'username'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Claims customizados no token
        token['name'] = user.name
        token['email'] = user.email or ''
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Adiciona dados do usuário
        user_serializer = UserSerializer(self.user)
        
        return {
            'user': user_serializer.data,
            'tokens': {
                'access': data['access'],
                'refresh': data['refresh'],
            }
        }


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para alteração de senha.
    
    Request:
    {
        "current_password": "senhaAtual",
        "new_password": "novaSenha123",
        "new_password_confirm": "novaSenha123"
    }
    """
    
    current_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate_current_password(self, value):
        """Valida senha atual."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value
    
    def validate(self, attrs):
        """Valida se novas senhas conferem."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'As senhas não conferem.'
            })
        return attrs
