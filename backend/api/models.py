from django.db import models
import uuid


class User(models.Model):

    ROLE_CHOICES = [
        ('aluno', 'Aluno'),
        ('professor', 'Professor'),
        ('admin', 'Admin'),
    ]

    name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    password = models.CharField(max_length=255)

    custom_prompt = models.TextField(
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    is_active = models.BooleanField(default=False)

    activation_token = models.UUIDField(default=uuid.uuid4, unique=True)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name



class Class(models.Model):

    name = models.CharField(max_length=100)

    course = models.CharField(max_length=100, blank=True, null=True)

    year = models.IntegerField()

    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='teaching_classes'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.name




class UserClass(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    classroom = models.ForeignKey(
        Class,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ('user', 'classroom')




class Conversation(models.Model):

    title = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    is_processed = models.BooleanField(default=False)

    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    deleted_at = models.DateTimeField(
        blank=True,
        null=True
    )

    users = models.ManyToManyField(
        User,
        through='UserConversation',
        through_fields=('conversation', 'user'),
    )

    def __str__(self):
        return self.title or f"Conversation {self.id}"



class UserConversation(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE
    )

    shared_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shared_by_me'
    )

    class Meta:
        unique_together = ('user', 'conversation')



class Message(models.Model):

    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    content = models.TextField()

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    def __str__(self):
        return f"{self.role} - {self.created_at}"


class AlarmingMessage(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alarming_messages'
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alerta de {self.user} - {self.created_at}"
