from typing import List, Generator, Dict

class LLMClient:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self.type = "dummy"

    def stream_response(
        self,
        role: str,
        system_prompt: str,
        # message_history: List[Message],
        user_query: str,
        functions_map: Dict,
        tools: List
    ) -> Generator[str]:
        yield "Hello"