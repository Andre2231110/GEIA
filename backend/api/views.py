from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ollama import Client
from .models import Class, User
from .serializers import ClassSerializer

OLLAMA_HOST = "https://ollama.com"
OLLAMA_TOKEN = "34d6cc52a55d4527b861bd142db9589a.Hzc6E2XUl5zqxxzsICTlmdcl"
OLLAMA_MODEL = "gpt-oss:120b"

_ollama = Client(
    host=OLLAMA_HOST,
    headers={"Authorization": f"Bearer {OLLAMA_TOKEN}"},
)


def hello(request):
    return JsonResponse({'message': 'Backend Django a funcionar!'})


@api_view(['POST'])
def admin_login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")

    try:
        user = User.objects.get(name=username, role='admin')
        if user.password == password and user.is_active:
            return Response({"success": True, "name": user.name})
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def llmcloud_chat(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Mensagem vazia."}, status=status.HTTP_400_BAD_REQUEST)

    response = _ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": message}],
    )
    reply = response["message"]["content"]
    return Response({"reply": reply})


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer