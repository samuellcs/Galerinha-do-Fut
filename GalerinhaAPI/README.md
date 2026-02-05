# GalerinhaAPI - Backend Django

Backend REST API para o sistema GalerinhaDoFut, desenvolvido em Django + Django REST Framework.

## 🛠️ Stack

- Python 3.11+
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Authentication (SimpleJWT)
- django-cors-headers

## 📁 Estrutura do Projeto (MVT)

```
GalerinhaAPI/
├── api/                # App principal (configurações Django)
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py     # Configurações do projeto
│   ├── urls.py         # URLs principais da API
│   └── wsgi.py
├── core/               # Utilitários compartilhados
│   ├── services/       # Regras de negócio isoladas
│   │   └── team_draw.py
│   ├── exceptions.py   # Handler de erros customizado
│   └── permissions.py  # Permissões customizadas
├── users/              # App de autenticação e usuários
├── peladas/            # App de gerenciamento de peladas
├── matches/            # App de partidas, times e estatísticas
├── rankings/           # App de ranking global
├── manage.py
├── requirements.txt
└── .env.example
```

## 🚀 Setup Inicial

### 1. Crie e ative o ambiente virtual

```bash
cd GalerinhaAPI
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Instale as dependências

```bash
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Configure o banco de dados PostgreSQL

Crie o banco de dados:

```sql
CREATE DATABASE galerinha_fut;
```

### 5. Execute as migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Crie um superusuário

```bash
python manage.py createsuperuser
```

### 7. Inicie o servidor

```bash
python manage.py runserver
```

A API estará disponível em `http://localhost:8000/api/`

## 🔗 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register/` | Registra novo usuário |
| POST | `/api/auth/login/` | Autentica usuário |
| POST | `/api/auth/refresh/` | Renova token JWT |
| GET | `/api/auth/me/` | Dados do usuário autenticado |
| PUT | `/api/auth/me/` | Atualiza dados do usuário |
| POST | `/api/auth/change-password/` | Altera senha |
| GET | `/api/auth/users/` | Lista todos os usuários |

### Peladas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/peladas/` | Lista todas as peladas |
| POST | `/api/peladas/` | Cria nova pelada |
| GET | `/api/peladas/{id}/` | Detalhes de uma pelada |
| POST | `/api/peladas/{id}/confirm/` | Confirma/cancela presença |
| POST | `/api/peladas/{id}/draw-teams/` | Sorteia times |

### Partidas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/matches/` | Lista todas as partidas |
| GET | `/api/matches/{id}/` | Detalhes de uma partida |
| POST | `/api/matches/{id}/start/` | Inicia partida |
| POST | `/api/matches/{id}/stats/` | Adiciona gol/assistência |
| DELETE | `/api/matches/{id}/stats/` | Remove estatística |
| POST | `/api/matches/{id}/finish/` | Finaliza partida |

### Ranking

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ranking/` | Ranking global |
| GET | `/api/ranking/player/{id}/` | Stats de um jogador |

## 📝 Exemplos de Request/Response

### Registro de Usuário

**Request:**
```json
POST /api/auth/register/
{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "password_confirm": "senha123"
}
```

**Response:**
```json
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
```

### Criar Pelada

**Request:**
```json
POST /api/peladas/
Authorization: Bearer {access_token}
{
    "name": "Futebol de Quinta",
    "date": "2024-01-20",
    "time": "19:00",
    "location": "Arena Society"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Futebol de Quinta",
        "date": "2024-01-20",
        "time": "19:00",
        "location": "Arena Society",
        "status": "open",
        "confirmedPlayers": [...],
        "confirmedCount": 1,
        "canDrawTeams": false,
        "userConfirmed": true
    }
}
```

### Sortear Times

**Request:**
```json
POST /api/peladas/1/draw-teams/
Authorization: Bearer {access_token}
{
    "numTeams": 2,
    "teamNames": ["Time Verde", "Time Branco"]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Times sorteados com sucesso!",
    "data": {
        "match": {
            "id": 1,
            "status": "active",
            "teams": [
                {
                    "id": 1,
                    "name": "Time Verde",
                    "players": [...],
                    "goalsCount": 0
                },
                {
                    "id": 2,
                    "name": "Time Branco",
                    "players": [...],
                    "goalsCount": 0
                }
            ]
        },
        "pelada": {...}
    }
}
```

### Registrar Gol

**Request:**
```json
POST /api/matches/1/stats/
Authorization: Bearer {access_token}
{
    "playerId": 1,
    "type": "goal"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Gol registrado!",
    "data": {
        "stat": {
            "id": 1,
            "playerId": 1,
            "playerName": "João Silva",
            "type": "goal",
            "timestamp": "2024-01-20T19:35:00Z"
        },
        "match": {...}
    }
}
```

## 🔐 Autenticação JWT

Todas as rotas (exceto registro e login) requerem autenticação via JWT.

**Header:**
```
Authorization: Bearer {access_token}
```

**Refresh Token:**
```json
POST /api/auth/refresh/
{
    "refresh": "eyJ..."
}
```

## ⚠️ Tratamento de Erros

Todas as respostas de erro seguem o padrão:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Mensagem amigável",
        "details": {}
    }
}
```

## 🧪 Testes

```bash
# Instalar dependências de teste
pip install pytest pytest-django factory-boy

# Executar testes
pytest
```

## 📦 Deploy

Para produção, use as configurações de `settings/production.py`:

```bash
export DJANGO_SETTINGS_MODULE=settings.production
```

## 🔧 Integração com Frontend React

O frontend deve:

1. Armazenar tokens JWT (localStorage ou httpOnly cookies)
2. Enviar `Authorization: Bearer {token}` em todas as requisições
3. Tratar refresh automático quando access token expirar
4. Mapear campos do response (camelCase no frontend, snake_case apenas internamente)

**Exemplo de serviço API no React:**

```typescript
const API_URL = 'http://localhost:8000/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error.message);
  }
  
  return data.data;
}
```

## 📄 Licença

MIT
