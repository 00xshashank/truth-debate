import os
from sqlmodel import create_engine, Session, SQLModel, Field
from typing import Annotated, Optional
from fastapi import Depends

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

class User(SQLModel, table=True):
    __tablename__ = "users" # pyright: ignore[reportAssignmentType]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    username: str = Field(unique=True, index=True)
    email: str
    password: str

    @property
    def db_id(self) -> int:
        if self.id is None:
            raise ValueError("User id not yet set => Value not yet saved in the database")
        return self.id

class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chatId: int = Field(foreign_key="chatmessage.id")
    url: str
    content: str

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="users.id")
    title: str = Field(default="New chat")

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversationId: int = Field(foreign_key="conversation.id")
    messageIndex: int
    sender: str
    role: str
    message: str

POSTGRES_HOSTNAME=os.getenv("POSTGRES_HOSTNAME")
POSTGRES_DB=os.getenv("POSTGRES_DB")
POSTGRES_USER=os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD=os.getenv("POSTGRES_PASSWORD")

POSTGRES_URL=f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOSTNAME}/{POSTGRES_DB}?sslmode=require&channel_binding=require"

engine = create_engine(
    url=POSTGRES_URL, 
    echo=True,
    pool_pre_ping=True
)

def create_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(create_session)]

if __name__ == "__main__":
    SQLModel.metadata.create_all(engine)
