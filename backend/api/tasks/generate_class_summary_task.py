# api/tasks/generate_class_summary_task.py

from django.db import transaction

from api.models import Conversation
from api.services.conversation_formatter import ConversationFormatter
from api.services.prompt_builder import PromptBuilder
from api.services.llm_local import LLMLocalService
from api.services.summary_persistence import SummaryPersistenceService


class GenerateClassSummaryTask:

    def __init__(self):
        self.formatter = ConversationFormatter()
        self.prompt_builder = PromptBuilder()
        self.llm = LLMLocalService()
        self.persistence = SummaryPersistenceService()

    @transaction.atomic
    def run(self, classroom):

        conversations, formatted = self.formatter.format(
            classroom.id
        )

        conversation_ids = list(
            conversations.values_list("id", flat=True)
        )

        print("IDs encontrados:", conversation_ids)

        if not conversation_ids:
            print("Não existem conversas novas.")
            return None

        if not formatted:
            print("As conversas não têm mensagens.")
            return None

        prompt = self.prompt_builder.build_class_summary_prompt(
            formatted
        )

        llm_response = self.llm.generate(
            prompt
        )

        print("Resposta do LLM:", llm_response)

        summary_content = (
            llm_response.get("summary")
            or llm_response.get("resumo")
            or llm_response.get("class_summary")
        )

        if not summary_content:
            raise RuntimeError(
                "A resposta do LLM não contém uma chave "
                "'summary', 'resumo' ou 'class_summary'. "
                f"Resposta recebida: {llm_response}"
            )

        print("Resumo gerado.")

        summary = self.persistence.save(
            classroom_id=classroom.id,
            summary=summary_content,
            conversations=list(conversations),
            llm_model=self.llm.model,
        )

        print("Resumo guardado.")

        updated = Conversation.objects.filter(
            id__in=conversation_ids
        ).update(
            is_processed=True
        )

        print("Conversas atualizadas:", updated)

        return summary