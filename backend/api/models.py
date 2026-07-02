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


class StudentDoubt(models.Model):

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='doubts_sent'
    )

    classroom = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='doubts'
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doubts'
    )

    description = models.TextField()

    teacher_reply = models.TextField(blank=True, null=True)

    replied_at = models.DateTimeField(blank=True, null=True)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dúvida de {self.student} - {self.classroom}"


class StudentDoubtMessage(models.Model):
    doubt = models.ForeignKey(StudentDoubt, on_delete=models.CASCADE, related_name='thread_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensagem de {self.sender} na dúvida {self.doubt_id}"
    

class ProcessingBatch(models.Model):
    STATUS_CHOICES = [
        ("running", "Running"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="running"
    )

    messages_processed = models.IntegerField(default=0)
    conversations_processed = models.IntegerField(default=0)
    classes_processed = models.IntegerField(default=0)

    llm_model = models.CharField(max_length=100, null=True, blank=True)
    processing_version = models.CharField(max_length=50, default="v1")

    error_message = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "processing_batch"


class DailyClassSummary(models.Model):
    batch = models.ForeignKey(
        ProcessingBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="daily_summaries"
    )

    classroom_id = models.IntegerField()
    date = models.DateField()

    summary = models.TextField()

    total_messages = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)

    confidence_score = models.FloatField(default=0.0)
    needs_review = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "daily_class_summary"
        unique_together = ("classroom_id", "date")


class TopicInsight(models.Model):
    DIFFICULTY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    daily_summary = models.ForeignKey(
        DailyClassSummary,
        on_delete=models.CASCADE,
        related_name="topic_insights"
    )

    topic = models.CharField(max_length=255)

    difficulty_level = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES
    )

    mentions_count = models.IntegerField(default=0)
    students_affected_count = models.IntegerField(default=0)

    confidence_score = models.FloatField(default=0.0)
    teacher_recommendation = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "topic_insight"


class FrequentQuestion(models.Model):
    daily_summary = models.ForeignKey(
        DailyClassSummary,
        on_delete=models.CASCADE,
        related_name="frequent_questions"
    )

    question = models.TextField()
    frequency = models.IntegerField(default=1)

    confidence_score = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "frequent_question"
