from api.models import Conversation


class ConversationFormatter:

    ROLE_LABELS = {
        "user": "Aluno",
        "assistant": "Assistente",
    }

    def get_unprocessed_conversations(self, classroom_id):

        return (
            Conversation.objects
            .filter(
                classroom_id=classroom_id,
                is_processed=False,
                is_archived=False,
                deleted_at__isnull=True,
            )
            .prefetch_related("messages")
            .order_by("created_at")
        )

    def format(self, classroom_id):

        conversations = self.get_unprocessed_conversations(
            classroom_id
        )

        sections = []

        for i, conversation in enumerate(conversations, start=1):

            sections.append(f"=== Conversa {i} ===")

            for message in conversation.messages.all():

                role = self.ROLE_LABELS.get(
                    message.role,
                    message.role,
                )

                sections.append(f"{role}:")
                sections.append(message.content.strip())
                sections.append("")

        formatted_text = "\n".join(sections).strip()

        return conversations, formatted_text