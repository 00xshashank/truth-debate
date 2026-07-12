from typing import List, Dict, Generator
import json
from loguru import logger
import cohere
from cohere import SystemChatMessageV2, UserChatMessageV2
import os

from llm.llm_client import LLMClient

if __name__=="__main__":
    from dotenv import load_dotenv
    load_dotenv()

COHERE_TRIAL_KEY=os.getenv("COHERE_TRIAL_KEY", "")

class CohereClient(LLMClient):
    def __init__(
            self, 
            model_name: str,
            tools: List | None = None,
            functions_map: Dict | None = None
        ) -> None:
        super().__init__(model_name)
        self.llmClient = cohere.ClientV2(COHERE_TRIAL_KEY)
        self.tools = tools
        self.functions_map = functions_map

    def stream_response(
        self,
        role: str,
        system_prompt: str,
        user_query: str,
        tools: List
    ) -> Generator[str]:
        messages=[
            SystemChatMessageV2(content=system_prompt), 
            UserChatMessageV2(content=user_query)
        ]

        if self.tools is not None and self.functions_map is not None:
            counter = 3
            while True:
                response = self.llmClient.chat(
                    model=self.model_name,
                    messages=messages,
                    tools=self.tools
                )

                if not response.message.tool_calls:
                    break

                messages.append(response.message)

                if response.message.tool_calls:
                    for tc in response.message.tool_calls:
                        if counter > 0:
                            counter -= 1
                            try:
                                tool_result = self.functions_map[tc.function.name](
                                    **json.loads(tc.function.arguments)
                                )
                                tool_content = []
                                for data in tool_result:
                                    # Optional: the "document" object can take an "id" field for use in citations, otherwise auto-generated
                                    tool_content.append(
                                        {
                                            "type": "document",
                                            "document": {"data": json.dumps(data)},
                                        }
                                    )
                                messages.append(
                                    {
                                        "role": "tool",
                                        "tool_call_id": tc.id,
                                        "content": tool_content,
                                    }
                                )
                            except Exception:
                                continue

        response = self.llmClient.chat_stream(
            model=self.model_name, messages=messages, tools=self.tools
        )

        citations = []
        for chunk in response:
            if chunk:
                if chunk.type == "content-delta" and chunk.delta and chunk.delta.message and chunk.delta.message.content and chunk.delta.message.content.text:
                    yield json.dumps({"model": self.model_name, "role": role, "message": str(chunk.delta.message.content.text)}) + "\n"
                if chunk.type == "citation-start" and chunk.delta and chunk.delta.message:
                    citations.append(chunk.delta.message.citations)
                if chunk.type not in ["citation-start", "content-delta"]:
                    print(f"Role: {role}, Event type: {chunk.type}", flush=True)

        for c in citations:
            logger.info(f"Citation: {c}")