from django.contrib import admin
from django.urls import path
from api.views import (
    hello, llmcloud_chat, admin_login, user_login,
    user_list, user_create, user_edit, user_delete, user_activate,
    class_list, class_create, class_edit, class_delete,
    class_students, class_add_student, class_remove_student,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/llmcloud/', llmcloud_chat),
    path('api/admin/login/', admin_login),

    # Users
    path('api/users/login/', user_login),
    path('api/users/', user_list),
    path('api/users/create/', user_create),
    path('api/users/<int:pk>/edit/', user_edit),
    path('api/users/<int:pk>/delete/', user_delete),
    path('api/users/activate/<uuid:token>/', user_activate),

    # Classes
    path('api/classes/', class_list),
    path('api/classes/create/', class_create),
    path('api/classes/<int:pk>/edit/', class_edit),
    path('api/classes/<int:pk>/delete/', class_delete),
    path('api/classes/<int:pk>/students/', class_students),
    path('api/classes/<int:pk>/students/add/', class_add_student),
    path('api/classes/<int:pk>/students/<int:student_pk>/remove/', class_remove_student),
]
