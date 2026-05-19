from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ollama import Client
from .models import Class, User, UserClass
from .serializers import ClassSerializer, UserSerializer

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
def user_login(request):
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    try:
        user = User.objects.get(email=email)
        if not user.is_active:
            return Response({"error": "Conta ainda não ativada."}, status=status.HTTP_401_UNAUTHORIZED)
        if user.password == password:
            return Response({"success": True, "id": user.id, "name": user.name, "email": user.email, "role": user.role})
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)


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



@api_view(['GET'])
def user_list(request):
    users = User.objects.all().order_by('name')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def user_create(request):
    data = {**request.data, 'is_active': False}
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_activate(request, token):
    try:
        user = User.objects.get(activation_token=token)
    except User.DoesNotExist:
        return Response({"error": "Link inválido."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
        user.is_active = True
        user.save()

    return Response({"success": True, "name": user.name})


@api_view(['PUT'])
def user_edit(request, pk):
    try:
        user = User.objects.get(pk=pk, role__in=['aluno', 'professor'])
    except User.DoesNotExist:
        return Response({"error": "Utilizador não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    if not data.get('password'):
        data.pop('password', None)
        serializer = UserSerializer(user, data=data, partial=True)
    else:
        serializer = UserSerializer(user, data=data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def user_delete(request, pk):
    try:
        user = User.objects.get(pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({"error": "Utilizador não encontrado."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def class_list(request):
    classes = Class.objects.select_related('teacher').all().order_by('name')
    serializer = ClassSerializer(classes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def class_create(request):
    serializer = ClassSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def class_edit(request, pk):
    try:
        cls = Class.objects.get(pk=pk)
    except Class.DoesNotExist:
        return Response({"error": "Turma não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    serializer = ClassSerializer(cls, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def class_delete(request, pk):
    try:
        cls = Class.objects.get(pk=pk)
        cls.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Class.DoesNotExist:
        return Response({"error": "Turma não encontrada."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def class_students(request, pk):
    try:
        cls = Class.objects.get(pk=pk)
    except Class.DoesNotExist:
        return Response({"error": "Turma não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    student_ids = UserClass.objects.filter(classroom=cls).values_list('user_id', flat=True)
    students = User.objects.filter(id__in=student_ids)
    serializer = UserSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def class_add_student(request, pk):
    try:
        cls = Class.objects.get(pk=pk)
    except Class.DoesNotExist:
        return Response({"error": "Turma não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    student_id = request.data.get('student_id')
    try:
        student = User.objects.get(pk=student_id, role='aluno')
    except User.DoesNotExist:
        return Response({"error": "Aluno não encontrado."}, status=status.HTTP_404_NOT_FOUND)
    _, created = UserClass.objects.get_or_create(user=student, classroom=cls)
    if not created:
        return Response({"error": "Aluno já está nesta turma."}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"success": True}, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def class_remove_student(request, pk, student_pk):
    try:
        uc = UserClass.objects.get(classroom_id=pk, user_id=student_pk)
        uc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except UserClass.DoesNotExist:
        return Response({"error": "Associação não encontrada."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def llmcloud_chat(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Mensagem vazia."}, status=status.HTTP_400_BAD_REQUEST)

    response = _ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": message}],
    )
    reply = response.message.content
    return Response({"reply": reply})


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer