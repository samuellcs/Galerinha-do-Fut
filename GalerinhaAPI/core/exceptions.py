"""
Custom Exception Handler for REST API

Padroniza todas as respostas de erro para facilitar consumo no frontend React.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Handler customizado que padroniza respostas de erro.
    
    Formato de resposta:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Mensagem amigável",
            "details": {} // opcional, detalhes específicos
        }
    }
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'success': False,
            'error': {
                'code': _get_error_code(response.status_code),
                'message': _get_error_message(exc, response),
                'details': _get_error_details(response.data)
            }
        }
        response.data = custom_response_data
    
    return response


def _get_error_code(status_code: int) -> str:
    """Retorna código de erro baseado no status HTTP."""
    codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        422: 'VALIDATION_ERROR',
        500: 'INTERNAL_ERROR',
    }
    return codes.get(status_code, 'UNKNOWN_ERROR')


def _get_error_message(exc, response) -> str:
    """Retorna mensagem de erro amigável."""
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        elif isinstance(exc.detail, dict):
            # Pega a primeira mensagem de erro do dict
            for key, value in exc.detail.items():
                if isinstance(value, list):
                    return str(value[0])
                return str(value)
    
    messages = {
        400: 'Requisição inválida.',
        401: 'Autenticação necessária.',
        403: 'Você não tem permissão para esta ação.',
        404: 'Recurso não encontrado.',
        405: 'Método não permitido.',
        500: 'Erro interno do servidor.',
    }
    return messages.get(response.status_code, 'Ocorreu um erro.')


def _get_error_details(data) -> dict:
    """Extrai detalhes do erro para debug/validação."""
    if isinstance(data, dict):
        return data
    elif isinstance(data, list):
        return {'errors': data}
    return {}


class APIException(Exception):
    """Base exception para erros de negócio da API."""
    
    def __init__(self, message: str, code: str = 'BUSINESS_ERROR', status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class ValidationError(APIException):
    """Erro de validação de dados."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(
            message=message,
            code='VALIDATION_ERROR',
            status_code=400
        )
        self.field = field


class NotFoundError(APIException):
    """Recurso não encontrado."""
    
    def __init__(self, message: str = 'Recurso não encontrado.'):
        super().__init__(
            message=message,
            code='NOT_FOUND',
            status_code=404
        )


class PermissionDeniedError(APIException):
    """Permissão negada."""
    
    def __init__(self, message: str = 'Você não tem permissão para esta ação.'):
        super().__init__(
            message=message,
            code='PERMISSION_DENIED',
            status_code=403
        )


class ConflictError(APIException):
    """Conflito de estado/dados."""
    
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code='CONFLICT',
            status_code=409
        )
