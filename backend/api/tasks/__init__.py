from api.models import Conversation

from api.services.conversation_formatter import ConversationFormatter
from api.services.prompt_builder import PromptBuilder
from api.services.llm_local import LLMLocalService


class SummarizeConversationTask:
    """
    Responsável por gerar um resumo de uma conversa.

    Esta classe apenas coordena o fluxo entre os vários serviços.
    Não contém lógica de negócio nem comunicação HTTP.
    """

    def __init__(self):
        self.formatter = ConversationFormatter()
        self.prompt_builder = PromptBuilder()
        self.llm = LLMLocalService()

    def execute(self, conversation: Conversation) -> str:
        """
        Processa uma conversa e devolve o resumo gerado pelo LLM.
        """

        formatted_conversation = self.formatter.format(
            conversation.messages.all()
        )

        prompt = self.prompt_builder.build_summary_prompt(
            formatted_conversation
        )

        summary = self.llm.generate(prompt)

        return summary