from pydantic import BaseModel
from enum import Enum

class MessageSender(Enum):
    USER = "user"
    SYSTEM = "system"
    MODEL = "model"

class Message(BaseModel):
    role: str
    sender: MessageSender
    content: str