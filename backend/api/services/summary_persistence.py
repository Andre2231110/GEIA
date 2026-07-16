from django.db import transaction
from django.utils import timezone

from api.models import ClassSummary


class SummaryPersistenceService:

    @transaction.atomic
    def save(
        self,
        *,
        classroom_id,
        summary,
        conversations,
        llm_model,
    ):

        total_messages = sum(
            conversation.messages.count()
            for conversation in conversations
        )

        return ClassSummary.objects.update_or_create(
            classroom_id=classroom_id,
            date=timezone.now().date(),
            defaults={
                "summary": summary,
                "conversation_count": len(conversations),
                "message_count": total_messages,
                "llm_model": llm_model,
            },
        )[0]