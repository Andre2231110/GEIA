from ollama import Client
import logging
import json


logger = logging.getLogger(__name__)


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
                        "role": "user",
                        "content": prompt,
                    }
                ],
                format="json",
            )

            content = response["message"]["content"]

            print("=" * 80)
            print(content)
            print("=" * 80)

            try:
                return json.loads(content)

            except json.JSONDecodeError:
                logger.error("O LLM devolveu um JSON inválido.")
                logger.debug(content)

                raise RuntimeError(
                    "O LLM devolveu uma resposta que não é um JSON válido."
                )

        except Exception as e:
            logger.exception("Erro ao comunicar com o Ollama.")
            raise RuntimeError(
                "Não foi possível comunicar com o Ollama."
            ) from e