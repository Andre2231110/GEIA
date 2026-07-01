from django.contrib import admin
from django.urls import path
from api.views import (
    hello, llmcloud_chat, admin_login, user_login,
    user_list, user_create, user_edit, user_delete, user_activate,change_password,
    teacher_login,teacher_stats,
    class_list, class_create, class_edit, class_delete,
    class_students, class_add_student, class_remove_student,
    conversation_list, conversation_messages, conversation_rename, conversation_delete, conversation_archive,
    shared_conversations_list, conversation_share,
    alarming_messages_list, alarming_message_mark_read,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/llmcloud/', llmcloud_chat),
    path('api/admin/login/', admin_login),

    path('api/users/login/', user_login),
    path('api/users/', user_list),
    path('api/users/create/', user_create),
    path('api/users/<int:pk>/edit/', user_edit),
    path('api/users/<int:pk>/delete/', user_delete),
    path('api/users/activate/<uuid:token>/', user_activate),
    path('api/users/<int:pk>/change-password/',change_password),

    path('api/teacher/login/',teacher_login),
    path('api/teacher/<int:pk>/stats',teacher_stats),
    path('api/conversations/', conversation_list),
    path('api/conversations/<int:pk>/messages/', conversation_messages),
    path('api/conversations/<int:pk>/rename/', conversation_rename),
    path('api/conversations/<int:pk>/delete/', conversation_delete),
    path('api/conversations/<int:pk>/archive/', conversation_archive),
    path('api/conversations/<int:pk>/share/', conversation_share),
    path('api/conversations/shared/', shared_conversations_list),

    path('api/alarming-messages/', alarming_messages_list),
    path('api/alarming-messages/<int:pk>/mark-read/', alarming_message_mark_read),

    path('api/classes/', class_list),
    path('api/classes/create/', class_create),
    path('api/classes/<int:pk>/edit/', class_edit),
    path('api/classes/<int:pk>/delete/', class_delete),
    path('api/classes/<int:pk>/students/', class_students),
    path('api/classes/<int:pk>/students/add/', class_add_student),
    path('api/classes/<int:pk>/students/<int:student_pk>/remove/', class_remove_student),
]
