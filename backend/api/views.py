import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ollama import Client
from .models import Class, User, UserClass, Conversation, Message, UserConversation
from .serializers import ClassSerializer, UserSerializer
from django.contrib.auth.hashers import check_password,make_password



_ollama = Client(
    host=os.getenv('OLLAMA_HOST'),
    headers={"Authorization": f"Bearer {os.getenv('OLLAMA_TOKEN')}"},
)
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL')


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
        if check_password(password, user.password):
            return Response({"success": True, "id": user.id, "name": user.name, "email": user.email, "role": user.role})
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "User não existe"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def admin_login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    

    try:
        user = User.objects.get(name=username, role='admin')
        if check_password(password, user.password) and user.is_active:
            return Response({"success": True, "name": user.name})
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "Credenciais inválidas."}, status=status.HTTP_403_FORBIDDEN)



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
    
@api_view(['PUT'])
def change_password(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {"error": "Utilizador não encontrado"},
            status=404
        )

    current_password = request.data.get(
        'current_password'
    )

    new_password = request.data.get(
        'new_password'
    )

    if not check_password(
        current_password,
        user.password
    ):
        return Response(
            {"error": "Password atual incorreta"},
            status=400
        )

    user.password = make_password(
        new_password
    )

    user.save()

    return Response({
        "success": True
    })




@api_view(['POST'])
def teacher_login(request):
    email = request.data.get('email', '')
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email=email)

        if user.role != 'professor':
            return Response(
                {'error': 'Acesso não autorizado.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'error': 'Conta desativada.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not check_password(password, user.password):
            return Response(
                {'error': 'Credenciais inválidas.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'Credenciais inválidas.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
@api_view(['GET'])
def teacher_stats(request, pk):
    try:
        teacher = User.objects.get(pk=pk, role='professor')
    except User.DoesNotExist:
        return Response(
            {"error": "Professor não encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )

    turmas = Class.objects.filter(teacher=teacher)

    total_turmas = turmas.count()

    total_alunos = UserClass.objects.filter(
        classroom__in=turmas,
        user__role='aluno'
    ).values('user').distinct().count()

    total_conversas = UserConversation.objects.filter(
        user__userclass__classroom__in=turmas,
        user__role='aluno'
    ).values('conversation').distinct().count()

    return Response({
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "email": teacher.email,
        },
        "total_turmas": total_turmas,
        "total_alunos": total_alunos,
        "total_conversas": total_conversas,
    })


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

    msgs_to_send = []
    user = None

    user_id = request.data.get("user_id")
    if user_id:
        try:
            user = User.objects.get(pk=user_id)
            if user.custom_prompt:
                msgs_to_send.append({"role": "system", "content": user.custom_prompt})
        except User.DoesNotExist:
            pass

    msgs_to_send.append({"role": "user", "content": message})

    response = _ollama.chat(model=OLLAMA_MODEL, messages=msgs_to_send)
    reply = response.message.content

    conv_id = None
    if user:
        conv = None
        conversation_id = request.data.get("conversation_id")
        if conversation_id:
            try:
                conv = Conversation.objects.get(pk=conversation_id)
            except Conversation.DoesNotExist:
                pass

        if not conv:
            conv = Conversation.objects.create(title=message[:60])
            UserConversation.objects.create(user=user, conversation=conv)

        Message.objects.create(role='user', content=message, conversation=conv)
        Message.objects.create(role='assistant', content=reply, conversation=conv)
        conv_id = conv.id

    return Response({"reply": reply, "conversation_id": conv_id})


@api_view(['GET'])
def conversation_list(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response([])
    convs = Conversation.objects.filter(
        userconversation__user_id=user_id,
        is_archived=False
    ).order_by('-updated_at')
    return Response([
        {'id': c.id, 'title': c.title or 'Sem título', 'updated_at': str(c.updated_at)}
        for c in convs
    ])


@api_view(['GET'])
def conversation_messages(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    msgs = conv.messages.order_by('created_at').values('role', 'content')
    return Response(list(msgs))


class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer