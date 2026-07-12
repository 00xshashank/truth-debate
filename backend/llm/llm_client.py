from typing import List, Generator

class LLMClient:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name

    def stream_response(
        self,
        role: str,
        system_prompt: str,
        # message_history: List[Message],
        user_query: str,
        tools: List | None = None
    ) -> Generator[str]:
        yield "Hello"