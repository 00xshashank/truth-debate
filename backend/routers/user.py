from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import select
from typing import Annotated
from pydantic import BaseModel
import os
from loguru import logger

from db import SessionDep, User, Conversation, ChatMessage
from pubmed import get_open_access_papers
from llm.gemini import GeminiClient
from llm.cohere import CohereClient
from chat import generate_final_response
from routers.auth import current_user_from_cookie, hash_password
from custom_types import Message, MessageSender
from prompts import proponent_system_prompt, challenger_system_prompt, judge_system_prompt

GEMINI_MODEL=os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
BACKUP_GEMINI_MODEL=os.getenv("BACKUP_GEMINI_MODEL", "gemini-2.0-flash-lite")

class PromptRequestBody(BaseModel):
    prompt: str

gemClient = GeminiClient(model_name=GEMINI_MODEL, backup_model_name=BACKUP_GEMINI_MODEL)

functions_map = {"get_open_access_papers": get_open_access_papers}

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_open_access_papers",
            "description": "Gets open access papers from PMC. You can call this function no more than 3 times per response.",
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

COHERE_MODEL_NAME=os.getenv("COHERE_MODEL_NAME", "")
cohereClient = CohereClient(
    model_name=COHERE_MODEL_NAME,
    tools=tools,
    functions_map=functions_map
)

user_router = APIRouter(prefix='/user', tags=['users'])

@user_router.post('/create-user')
async def create_user(user: User, session: SessionDep):
    user.password = hash_password(user.password)

    statement = select(User).where(User.username == user.username)
    results = session.exec(statement).first()
    if results is not None:
        return {
            "success": False,
            "message": "User with specified username already exists"
        }

    session.add(user)
    session.commit()
    session.refresh(user)
    return {
        "success": True,
        "message": user.username
    }

@user_router.get('/create-chat')
async def create_chat(user: Annotated[User | None, Depends(current_user_from_cookie)], session: SessionDep):
    if user is None:
        return {
            "status":"failure",
            "message":-1
        }

    newChat = Conversation(
        userId=user.db_id
    )

    session.add(newChat)
    session.commit()

    session.refresh(newChat)

    return {
        "status":"success",
        "message":newChat.id
    }

@user_router.get('/get-chats')
async def retrieve_chats(user: Annotated[User | None, Depends(current_user_from_cookie)], session: SessionDep):    
    if user is None:
        return { "conversations": [] }
    
    statement = select(Conversation).where(Conversation.userId == user.db_id)
    results = session.exec(statement)
    
    conversations = []
    for conv in results:
        conversations.append({
            "id": conv.id,
            "title": conv.title
        })

    return {"conversations": conversations}

@user_router.get('/chat/{chat_id}')
async def get_messages(chat_id: int, user: Annotated[User | None, Depends(current_user_from_cookie)], session: SessionDep):    
    if user is None:
        return {"messages": None}
    
    check_statement = select(Conversation).where(Conversation.id == chat_id)
    check_result = session.exec(check_statement)
    for result in check_result:
        if result.userId != user.db_id:
            return {"messages":None}
        break
    
    statement = select(ChatMessage).where(ChatMessage.conversationId == chat_id)
    results = session.exec(statement)

    messages = []
    for msg in results:
        messages.append({
            "messageIndex": msg.messageIndex,
            "sender": msg.sender,
            "role": msg.role,
            "message": msg.message
        })

    return {"messages": messages}

@user_router.post('/{chat_id}/message')
async def new_message(chat_id: int, reqBody: PromptRequestBody, user: Annotated[User | None, Depends(current_user_from_cookie)], session: SessionDep):    
    if user is None:
        return ""
    
    prompt = reqBody.prompt
    logger.info(f"User prompt received: {prompt}, chat id: {chat_id}")

    statement = select(ChatMessage).where(ChatMessage.conversationId == chat_id)
    results = session.exec(statement)

    messages = []
    for msg in results:
        messages.append(Message(
            role=msg.role,
            sender=MessageSender.USER if msg.sender in ["user", "system"] else MessageSender.MODEL,
            content=msg.message
        ))

    logger.info(f"Number of retrieved messages in history: {len(messages)}")

    user_msg = ChatMessage(
        conversationId=chat_id,
        messageIndex=len(messages)+1,
        sender="user",
        role="user",
        message=prompt
    )
    session.add(user_msg)
    session.commit()

    logger.info(f"Passed messages: {messages}")
    return StreamingResponse(
        generate_final_response(
            message_history=messages,
            user_query=prompt,
            proponentLlmClient=gemClient,
            proponent_system_prompt=proponent_system_prompt,
            challengerLlmClient=gemClient,
            challenger_system_prompt=challenger_system_prompt,
            judgeLlmClient=gemClient,
            judge_system_prompt=judge_system_prompt,
            session=session,
            conversationId=chat_id
        ),
        media_type="text/plain"
    )

