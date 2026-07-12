from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

from routers.user import user_router
from routers.auth import auth_router
from routers.audio import audio_router

app = FastAPI()

app.include_router(router=user_router)
app.include_router(router=auth_router)
app.include_router(router=audio_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)