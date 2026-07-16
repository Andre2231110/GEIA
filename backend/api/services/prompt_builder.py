class PromptBuilder:

    CLASS_SUMMARY_PROMPT = """
És um assistente especializado em analisar conversas entre alunos e um tutor de IA.

Todas as conversas pertencem à mesma turma e ocorreram durante o mesmo período.

O teu objetivo NÃO é resumir cada conversa individualmente.

O teu objetivo é produzir uma memória pedagógica da turma que será utilizada posteriormente por outro modelo de IA para responder às perguntas do professor.

O resumo deve ajudar um professor que nunca leu estas conversas a perceber rapidamente:

- quais foram os principais temas estudados;
- quais os conceitos que geraram mais dificuldades;
- quais os erros ou ideias erradas que apareceram repetidamente;
- quais os tópicos que parecem estar bem compreendidos;
- quais os assuntos que deverão ser revistos na próxima aula;
- se existiram padrões relevantes entre vários alunos.

Não inventes informação.

Não repitas exemplos individuais desnecessários.

Foca-te apenas em padrões observados ao longo das conversas.

Escreve um resumo claro, objetivo e útil para um professor.

Responde APENAS com JSON válido.

Formato obrigatório:

{{
    "summary": "..."
}}

Conversas:

{conversations}
"""

    def build_class_summary_prompt(self, conversations: str):
        return self.CLASS_SUMMARY_PROMPT.format(
            conversations=conversations
        ).strip()