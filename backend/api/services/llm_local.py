from ollama import Client
import logging
import json


logger = logging.getLogger(__name__)


SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": (
                "Resumo das principais dificuldades, dúvidas, "
                "temas e necessidades dos alunos."
            ),
        }
    },
    "required": ["summary"],
}


class LLMLocalService:

    def __init__(
        self,
        host: str = "http://localhost:11434",
        model: str = "lfm2.5-thinking:latest",
    ):
        self.client = Client(host=host)
        self.model = model

    def generate(self, prompt: str) -> dict:
        try:
            response = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "És um assistente responsável por analisar "
                            "conversas educativas. Responde exclusivamente "
                            "com um objeto JSON que siga o schema fornecido."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                format=SUMMARY_SCHEMA,
                options={
                    "temperature": 0,
                },
            )

            content = response["message"]["content"].strip()

            print("=" * 80)
            print(content)
            print("=" * 80)

            if not content:
                raise RuntimeError(
                    "O LLM devolveu uma resposta vazia."
                )

            try:
                result = json.loads(content)
            except json.JSONDecodeError as error:
                raise RuntimeError(
                    "O LLM devolveu um JSON inválido. "
                    f"Resposta recebida: {content}"
                ) from error

            summary = result.get("summary")

            if not isinstance(summary, str) or not summary.strip():
                raise RuntimeError(
                    "O LLM não devolveu um resumo válido. "
                    f"Resposta recebida: {result}"
                )

            result["summary"] = summary.strip()

            return result

        except Exception:
            logger.exception("Erro ao comunicar com o Ollama.")
            raise