import os
from google import genai
from typing import List, Generator
from google.genai import types
from loguru import logger
import json

from llm.llm_client import LLMClient

if __name__=="__main__":
    from dotenv import load_dotenv
    load_dotenv()

GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")

class GeminiClient(LLMClient):
    def __init__(self, model_name: str, backup_model_name: str | None = None) -> None:
        super().__init__(model_name)
        self.type = "gemini"
        self.backup_model_name = backup_model_name
        self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)

    def stream_response_content(
        self,
        role: str,
        system_prompt: str,
        # message_history: List[Message],
        user_query: str,
        gemini_model: str,
        functions_map,
        tools: List
    ) -> Generator[str]:
        model_response = self.gemini_client.models.generate_content_stream(
            model=gemini_model,
            contents=[{
                "role":"user",
                "parts": [{"text": user_query}] 
            }],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools if tools is not None else []
            )
        )

        for chunk in model_response:
            if chunk.text:
                yield json.dumps({"model": gemini_model, "role": role, "message": chunk.text}) + "\n"

    def stream_response(
        self,
        role: str,
        system_prompt: str,
        # message_history: List[Message],
        user_query: str,
        functions_map,
        tools: List
    ) -> Generator[str]:
        try:
            for chunk in self.stream_response_content(
                role=role,
                system_prompt=system_prompt,
                user_query=user_query,
                gemini_model=self.model_name,
                functions_map=functions_map,
                tools=tools
            ):
                yield chunk

        except Exception:
            logger.debug(f"Switching to backup model for role: {role}")
            if self.backup_model_name is not None:
                for chunk in self.stream_response_content(
                    role=role,
                    system_prompt=system_prompt,
                    user_query=user_query,
                    gemini_model=self.backup_model_name,
                    functions_map=functions_map,
                    tools=tools
                ):
                    yield chunk