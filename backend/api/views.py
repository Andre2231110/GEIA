from django.http import JsonResponse
from rest_framework import viewsets
from .models import Class
from .serializers import ClassSerializer

def hello(request):
    return JsonResponse({
        'message': 'Backend Django a funcionar!'
    })

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer