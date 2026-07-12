import os
from typing import List
import json
from loguru import logger
import time
from sqlmodel import Session


from custom_types import Message
from pubmed import get_open_access_papers
from llm.llm_client import LLMClient
from llm.cohere import CohereClient
from llm.gemini import GeminiClient
from db import ChatMessage

if __name__=="__main__":
    from dotenv import load_dotenv
    load_dotenv()

def get_verdict(judge_response: str) -> str:
    verdict_idx = judge_response.find("VERDICT")
    if verdict_idx == -1:
        logger.error("VERDICT not present in the final ")

    verdict_idx += len("VERDICT:")
    while not judge_response[verdict_idx].isalnum():
        verdict_idx+=1

    verdict_end = verdict_idx
    while judge_response[verdict_end].isalnum() or judge_response[verdict_end]=="_":
        verdict_end+=1

    return judge_response[verdict_idx:verdict_end]

def generate_final_response(
    message_history: List[Message],
    user_query: str,
    proponentLlmClient: LLMClient,
    proponent_system_prompt: str,
    challengerLlmClient: LLMClient,
    challenger_system_prompt: str,
    judgeLlmClient: LLMClient,
    judge_system_prompt: str,
    session: Session,
    conversationId: int,
    max_debate_rounds: int = 3
):
    message_history_str = "--- Message History ---\n"
    for msg in message_history:
        message_history_str += f"Role: {msg.role}, COntents: {msg.content}\n"

    print(f"Constructed messge history string: {message_history_str}")

    proponent_response = ""
    challenger_response = ""
    judge_response = ""

    if len(message_history)>0:
        proponent_prompt = f"{message_history_str}--- User query ---\n{user_query}"
    else:
        proponent_prompt = f"--- User query ---\n{user_query}"
    print("--- Starting proponent streaming ---")
    for chunk in proponentLlmClient.stream_response(
        role="proponent",
        system_prompt=proponent_system_prompt,
        user_query=proponent_prompt,
        tools=[get_open_access_papers]
    ):
        proponent_response += (json.loads(chunk))["message"]
        yield chunk

    proponent_chat_message = ChatMessage(
        conversationId=conversationId,
        messageIndex=len(message_history)+2,
        sender=proponentLlmClient.model_name,
        role="proponent",
        message=proponent_response
    )

    session.add(proponent_chat_message)
    session.commit()

    time.sleep(2)

    print(f"--- Final proponent response ---\n{proponent_response}\n")

    if len(message_history)>0:
        challenger_prompt = f"{message_history_str}User query: {user_query}\n--- PROPONENT ARGUMENT --- \n{proponent_response}"
    else:
        challenger_prompt = f"User query: {user_query}\n--- PROPONENT ARGUMENT --- \n{proponent_response}"
    
    print("--- Starting challenger streaming ---")
    for chunk in challengerLlmClient.stream_response(
        role="challenger",
        system_prompt=challenger_system_prompt,
        user_query=challenger_prompt,
        tools=[get_open_access_papers]
    ):
        challenger_response += (json.loads(chunk))["message"]
        yield chunk

    challenger_chat_message = ChatMessage(
        conversationId=conversationId,
        messageIndex=len(message_history)+3,
        sender=challengerLlmClient.model_name,
        role="challenger",
        message=challenger_response
    )

    session.add(challenger_chat_message)
    session.commit()

    time.sleep(2)

    print(f"--- Final challenger response ---\n{challenger_response}\n")

    if len(message_history)>0:
        judge_query = f"{message_history_str}User query: {user_query}\n--- ROUND {round} ---\n--- PROPONENT---\n{proponent_response}\n--- CHALLENGER ---\n{challenger_response}\n"
    else:
        judge_query = f"User query: {user_query}\n--- ROUND {round} ---\n--- PROPONENT---\n{proponent_response}\n--- CHALLENGER ---\n{challenger_response}\n"
    judge_response = ""
    print("--- Starting judge streaming ---")
    for chunk in judgeLlmClient.stream_response(
        role="judge",
        system_prompt=judge_system_prompt,
        user_query=judge_query,
        tools=[get_open_access_papers]
    ):
        judge_response += (json.loads(chunk))["message"]
        yield chunk

    judge_chat_message = ChatMessage(
        conversationId=conversationId,
        messageIndex=len(message_history)+4,
        sender=judgeLlmClient.model_name,
        role="judge",
        message=judge_response
    )

    session.add(judge_chat_message)
    session.commit()

    print(f"--- Final judge response ---\n{judge_response}\n")

if __name__=="__main__":

    GEMINI_MODEL=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    BACKUP_GEMINI_MODEL=os.getenv("BACKUP_GEMINI_MODEL", "gemini-2.0-flash-lite")

    gemClient = GeminiClient(model_name=GEMINI_MODEL, backup_model_name=BACKUP_GEMINI_MODEL)
    COHERE_MODEL_NAME=os.getenv("COHERE_MODEL_NAME", "")

    functions_map = {"get_open_access_papers": get_open_access_papers}

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_open_access_papers",
                "description": "Gets open access papers from PMC. Please call this function no more than 3 times per response.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Query string to search PMC",
                        }
                    },
                    "required": ["query"],
                },
            },
        }
    ]
    
    cohereClient = CohereClient(
        model_name=COHERE_MODEL_NAME,
        tools=tools,
        functions_map=functions_map
    )

    # def f():
    #     current_role = ""
    #     for chunk in generate_final_response(
    #         [],
    #         "Bananas are good for health, even for diabetics",
    #         gemClient,
    #         proponent_system_prompt,
    #         cohereClient,
    #         challenger_system_prompt,
    #         cohereClient,
    #         judge_system_prompt
    #     ):
    #         splitChunk = chunk.split('\n')
    #         for chunk in splitChunk:
    #             if len(chunk) > 0:
    #                 jsonChunk = json.loads(chunk)
    #                 if jsonChunk['role'] != current_role:
    #                     print(f"\n\n--- Role: {jsonChunk['role']} --- Model: {jsonChunk['model']} ---")
    #                     current_role = jsonChunk['role']

    #                 messageText = jsonChunk['message']
    #                 print(messageText, end="", flush=True)


    # f()
