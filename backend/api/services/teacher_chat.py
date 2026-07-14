from api.services.summary_retriever import SummaryRetriever
from api.services.teacher_prompt_builder import TeacherPromptBuilder
from api.services.llm_Cloud import LLMCloud


class TeacherChat:

    def __init__(self):
        self.summary_retriever = SummaryRetriever()
        self.prompt_builder = TeacherPromptBuilder()
        self.llm = LLMCloud()

    def chat(self, classroom_id, question, model):

        context = self.summary_retriever.get_context(
            classroom_id
        )

        prompt = self.prompt_builder.build(
            context=context,
            question=question,
        )

        response = self.llm.generate(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        return response