import os
import threading
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

from django.http import JsonResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ollama import Client
from .models import Class, User, UserClass, Conversation, Message, UserConversation, AlarmingMessage, StudentDoubt, StudentDoubtMessage
from .serializers import ClassSerializer, UserSerializer
from django.contrib.auth.hashers import check_password,make_password



_ollama = Client(
    host=os.getenv('OLLAMA_HOST'),
    headers={"Authorization": f"Bearer {os.getenv('OLLAMA_TOKEN')}"},
)
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL')

ALLOWED_MODELS = {
    'gpt-oss:20b-cloud':     'GPT OSS 20B',
    'ministral-3:14b-cloud': 'Ministral 3 14B',
    'qwen3-coder:480b-cloud': 'Qwen3 Coder 480B',
}


def hello(request):
    return JsonResponse({'message': 'Backend Django a funcionar!'})


@api_view(['GET'])
def models_list(request):
    return Response([{'id': k, 'name': v} for k, v in ALLOWED_MODELS.items()])



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


@api_view(['POST'])
def student_doubt_submit(request):
    student_id = request.data.get('student_id')
    classroom_id = request.data.get('classroom_id')
    description = request.data.get('description', '').strip()
    conversation_id = request.data.get('conversation_id')
    if not student_id or not classroom_id or not description:
        return Response({'error': 'Campos obrigatórios em falta.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        student = User.objects.get(pk=student_id, role='aluno')
        classroom = Class.objects.get(pk=classroom_id)
    except (User.DoesNotExist, Class.DoesNotExist):
        return Response({'error': 'Aluno ou turma não encontrados.'}, status=status.HTTP_404_NOT_FOUND)
    if not UserClass.objects.filter(user=student, classroom=classroom).exists():
        return Response({'error': 'O aluno não pertence a esta turma.'}, status=status.HTTP_403_FORBIDDEN)
    conversation = None
    if conversation_id:
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            pass
    doubt = StudentDoubt.objects.create(
        student=student, classroom=classroom,
        description=description, conversation=conversation
    )
    return Response({'id': doubt.id}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def teacher_doubts(request, pk):
    try:
        teacher = User.objects.get(pk=pk, role='professor')
    except User.DoesNotExist:
        return Response({'error': 'Professor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    turmas = Class.objects.filter(teacher=teacher)
    doubts = StudentDoubt.objects.filter(classroom__in=turmas).select_related('student', 'classroom', 'conversation').order_by('-created_at')
    result = []
    for d in doubts:
        messages = []
        if d.conversation:
            messages = list(
                Message.objects.filter(conversation=d.conversation)
                .order_by('created_at')
                .values('role', 'content')
            )
        result.append({
            'id': d.id,
            'description': d.description,
            'student_name': d.student.name,
            'class_name': d.classroom.name,
            'is_read': d.is_read,
            'created_at': d.created_at.isoformat(),
            'conversation_title': d.conversation.title if d.conversation else None,
            'messages': messages,
        })
    return Response(result)


@api_view(['PATCH'])
def teacher_doubt_mark_read(request, pk):
    try:
        doubt = StudentDoubt.objects.get(pk=pk)
    except StudentDoubt.DoesNotExist:
        return Response({'error': 'Não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    doubt.is_read = True
    doubt.save()
    return Response({'ok': True})


@api_view(['PATCH'])
def teacher_doubt_reply(request, pk):
    try:
        doubt = StudentDoubt.objects.get(pk=pk)
    except StudentDoubt.DoesNotExist:
        return Response({'error': 'Não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    reply = request.data.get('reply', '').strip()
    if not reply:
        return Response({'error': 'Resposta não pode estar vazia.'}, status=status.HTTP_400_BAD_REQUEST)
    doubt.teacher_reply = reply
    doubt.replied_at = timezone.now()
    doubt.is_read = True
    doubt.save()
    return Response({'ok': True})


@api_view(['GET'])
def student_doubts_list(request):
    student_id = request.query_params.get('student_id')
    if not student_id:
        return Response([])
    doubts = StudentDoubt.objects.filter(
        student_id=student_id,
        teacher_reply__isnull=False
    ).select_related('classroom').order_by('-replied_at')
    return Response([{
        'id': d.id,
        'description': d.description,
        'teacher_reply': d.teacher_reply,
        'class_name': d.classroom.name,
        'replied_at': d.replied_at.isoformat() if d.replied_at else None,
    } for d in doubts])


@api_view(['GET'])
def student_classes(request):
    student_id = request.query_params.get('student_id')
    if not student_id:
        return Response([])
    entries = UserClass.objects.filter(user_id=student_id).select_related('classroom')
    return Response([{'id': e.classroom.id, 'name': e.classroom.name} for e in entries])


@api_view(['GET', 'POST'])
def doubt_messages(request, pk):
    try:
        doubt = StudentDoubt.objects.get(pk=pk)
    except StudentDoubt.DoesNotExist:
        return Response({'error': 'Não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        msgs = StudentDoubtMessage.objects.filter(doubt=doubt).select_related('sender').order_by('created_at')
        return Response([{
            'id': m.id,
            'sender_id': m.sender_id,
            'sender_name': m.sender.name,
            'sender_role': m.sender.role,
            'content': m.content,
            'created_at': m.created_at.isoformat(),
        } for m in msgs])

    sender_id = request.data.get('sender_id')
    content = request.data.get('content', '').strip()
    if not sender_id or not content:
        return Response({'error': 'Campos obrigatórios em falta.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        sender = User.objects.get(pk=sender_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilizador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    msg = StudentDoubtMessage.objects.create(doubt=doubt, sender=sender, content=content)
    if sender.role == 'professor' and not doubt.teacher_reply:
        doubt.teacher_reply = content
        doubt.replied_at = timezone.now()
        doubt.is_read = True
        doubt.save()
    return Response({
        'id': msg.id,
        'sender_id': msg.sender_id,
        'sender_name': msg.sender.name,
        'sender_role': msg.sender.role,
        'content': msg.content,
        'created_at': msg.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


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


def _classify_and_save(message, user):
    try:
        classification_msgs = [
            {
                "role": "user",
                "content": (
                    "You are a strict content safety classifier for a school platform used by students.\n"
                    "Your job is to detect genuinely dangerous or harmful messages — NOT normal academic content.\n\n"
                    "Reply ALARM ONLY if the message clearly and explicitly involves:\n"
                    "- Direct threats of violence against people or institutions\n"
                    "- Instructions to build weapons or cause physical harm\n"
                    "- Self-harm or suicide (explicit statements, not academic study of the topic)\n"
                    "- Illegal drug use or trafficking\n"
                    "- Pornographic or sexual content involving minors\n"
                    "- Severe harassment or hate speech targeting a specific person or group\n\n"
                    "Reply SAFE for everything else, including:\n"
                    "- Math, science, history, literature, or any academic subject\n"
                    "- Requests about fractions, equations, integrals, or any mathematical notation\n"
                    "- Questions about how things work, even sensitive historical events\n"
                    "- Normal school assignments and study help\n"
                    "- Casual conversation or greetings\n\n"
                    "When in doubt, reply SAFE. Only flag messages with clear and obvious harmful intent.\n\n"
                    "Reply with ONLY ONE WORD: ALARM or SAFE\n\n"
                    f"Message: {message}"
                ),
            }
        ]
        result = _ollama.chat(model=OLLAMA_MODEL, messages=classification_msgs)
        if 'ALARM' in result.message.content.upper():
            AlarmingMessage.objects.create(user=user, message=message)
    except Exception:
        pass


@api_view(['POST'])
def llmcloud_chat(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Mensagem vazia."}, status=status.HTTP_400_BAD_REQUEST)

    BASE_SYSTEM_PROMPT = (
        "You are a helpful educational assistant. "
        "When writing any mathematical expression — fractions, integrals, derivatives, sums, roots, or equations — "
        "always use LaTeX notation. "
        "Use $...$ for inline math (e.g. $\\frac{1}{2}$, $\\int_a^b f(x)\\,dx$) "
        "and $$...$$ on its own line for display math. "
        "Never write fractions as '1/2' — always use $\\frac{1}{2}$."
    )

    msgs_to_send = [{"role": "system", "content": BASE_SYSTEM_PROMPT}]
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

    model = request.data.get('model', OLLAMA_MODEL)
    if model not in ALLOWED_MODELS:
        model = OLLAMA_MODEL

    response = _ollama.chat(model=model, messages=msgs_to_send)
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

        t = threading.Thread(target=_classify_and_save, args=(message, user), daemon=True)
        t.start()

    return Response({"reply": reply, "conversation_id": conv_id})


@api_view(['GET'])
def alarming_messages_list(request):
    msgs = AlarmingMessage.objects.select_related('user').order_by('-created_at')
    data = [
        {
            'id': m.id,
            'user_name': m.user.name if m.user else 'Desconhecido',
            'user_email': m.user.email if m.user else '',
            'message': m.message,
            'is_read': m.is_read,
            'created_at': m.created_at.isoformat(),
        }
        for m in msgs
    ]
    return Response(data)


@api_view(['POST'])
def alarming_message_mark_read(request, pk):
    try:
        msg = AlarmingMessage.objects.get(pk=pk)
        msg.is_read = True
        msg.save()
        return Response({'success': True})
    except AlarmingMessage.DoesNotExist:
        return Response({'error': 'Não encontrado.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def conversation_list(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response([])
    convs = Conversation.objects.filter(
        userconversation__user_id=user_id,
        userconversation__shared_by__isnull=True,
        is_archived=False,
        deleted_at__isnull=True
    ).order_by('-updated_at')
    return Response([
        {'id': c.id, 'title': c.title or 'Sem título', 'updated_at': str(c.updated_at)}
        for c in convs
    ])


@api_view(['DELETE'])
def conversation_delete(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    conv.deleted_at = timezone.now()
    conv.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
def conversation_archive(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    conv.is_archived = True
    conv.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def conversation_archived_list(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response([])
    convs = Conversation.objects.filter(
        userconversation__user_id=user_id,
        userconversation__shared_by__isnull=True,
        is_archived=True,
        deleted_at__isnull=True
    ).order_by('-updated_at')
    return Response([
        {'id': c.id, 'title': c.title or 'Sem título', 'updated_at': str(c.updated_at)}
        for c in convs
    ])


@api_view(['PATCH'])
def conversation_unarchive(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    conv.is_archived = False
    conv.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
def conversation_rename(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    title = request.data.get('title', '').strip()
    if not title:
        return Response({'error': 'Título não pode ser vazio.'}, status=status.HTTP_400_BAD_REQUEST)
    conv.title = title[:255]
    conv.save()
    return Response({'id': conv.id, 'title': conv.title})


@api_view(['GET'])
def shared_conversations_list(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        return Response([])
    convs = Conversation.objects.filter(
        userconversation__user_id=user_id,
        userconversation__shared_by__isnull=False,
        is_archived=False,
        deleted_at__isnull=True
    ).select_related().order_by('-updated_at')
    result = []
    for c in convs:
        uc = c.userconversation_set.filter(user_id=user_id).first()
        result.append({
            'id': c.id,
            'title': c.title or 'Sem título',
            'updated_at': str(c.updated_at),
            'shared_by_name': uc.shared_by.name if uc and uc.shared_by else '',
        })
    return Response(result)


@api_view(['POST'])
def conversation_share(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversa não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    email = request.data.get('email', '').strip()
    sharer_id = request.data.get('user_id')

    try:
        target = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Utilizador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        sharer = User.objects.get(pk=sharer_id)
    except User.DoesNotExist:
        return Response({'error': 'Utilizador inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    if target.id == sharer.id:
        return Response({'error': 'Não podes partilhar contigo próprio.'}, status=status.HTTP_400_BAD_REQUEST)

    _, created = UserConversation.objects.get_or_create(
        user=target,
        conversation=conv,
        defaults={'shared_by': sharer},
    )
    if not created:
        return Response({'error': 'Conversa já partilhada com este utilizador.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'success': True})


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