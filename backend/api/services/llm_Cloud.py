import os
from ollama import Client


class LLMCloud:

    def __init__(self):
        self.client = Client(
            host=os.getenv("OLLAMA_HOST"),
            headers={
                "Authorization": f"Bearer {os.getenv('OLLAMA_TOKEN')}"
            },
        )

    def generate(self, model, messages):

        response = self.client.chat(
            model=model,
            messages=messages,
        )

        return response.message.content