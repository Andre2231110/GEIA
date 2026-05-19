from rest_framework import serializers
from .models import Class, User, UserClass


class ClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True, allow_null=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['id', 'name', 'course', 'year', 'teacher', 'teacher_name', 'student_count', 'created_at']

    def get_student_count(self, obj):
        return UserClass.objects.filter(classroom=obj).count()


class UserSerializer(serializers.ModelSerializer):
    classes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'custom_prompt', 'is_active', 'created_at', 'classes']
        extra_kwargs = {'password': {'write_only': True}}

    def get_classes(self, obj):
        # alunos → via UserClass; professores → via Class.teacher FK
        as_student = [
            {'id': uc.classroom.id, 'name': uc.classroom.name}
            for uc in obj.userclass_set.select_related('classroom').all()
        ]
        as_teacher = [
            {'id': cls.id, 'name': cls.name}
            for cls in Class.objects.filter(teacher=obj)
        ]
        return as_student + as_teacher

    def validate_role(self, value):
        if value not in ('aluno', 'professor', 'admin'):
            raise serializers.ValidationError("Role tem de ser 'aluno', 'professor' ou 'admin'.")
        return value