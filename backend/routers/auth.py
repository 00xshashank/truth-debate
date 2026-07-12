from fastapi import APIRouter, Depends, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pwdlib import PasswordHash
from sqlmodel import select, Session
from datetime import datetime, timedelta, timezone
from typing import Any, Annotated
import jwt
from jwt import InvalidTokenError
from pydantic import BaseModel
import os
from loguru import logger

from db import User, SessionDep

auth_router = APIRouter(tags=['auth'], prefix='/auth')

ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "")
if SECRET_KEY == "":
    raise ValueError("SECRET_KEY not set in environment variables")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{auth_router.prefix}/token")

pwd_hasher = PasswordHash.recommended()

class Token(BaseModel):
    access_token: str
    token_type: str

def hash_password(password: str) -> str:
    return pwd_hasher.hash(password)

def verify_hashed_password(plaintext: str, hashed: str) -> bool:
    return pwd_hasher.verify(plaintext, hashed)

async def get_user_from_db(username: str, session: Session) -> (User | None):
    statement = select(User).where(User.username == username)
    results = session.exec(statement).first()
    return results

async def authenticate_user(username: str, password: str, session: Session) -> (User | None):
    user = await get_user_from_db(username, session)
    if user is None:
        return None
    
    if verify_hashed_password(password, user.password):
        return user
    
    return None

def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expiration = datetime.now(timezone.utc) + expires_delta
    else:
        expiration = datetime.now(timezone.utc) + timedelta(days=7.0)
    to_encode.update({'exp':expiration.timestamp()})

    return jwt.encode(payload=to_encode, key=SECRET_KEY, algorithm=ALGORITHM)

async def current_user_from_cookie(request: Request, session: SessionDep) -> User | None:
    token = request.cookies.get('access_token', None)
    logger.info(f"Token is {token}")
    if token is None:
        return None
    
    try:
        token_data = jwt.decode(token, key=SECRET_KEY, algorithms=ALGORITHM)
        username = token_data.get('sub', None)
        logger.info(f"Username taken from token: {username}")

        if username is None:
            logger.info("Database query returned no user")
            return None
        
        user = await get_user_from_db(username=username, session=session)
        return user

    except InvalidTokenError:
        logger.info("Error in current_user_from_cookie while decoding JWT")
        return None

@auth_router.post('/token')
async def get_token(response: Response, form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    user = await authenticate_user(form_data.username, form_data.password, session)
    if user is None:
        return "NO"

    delta = timedelta(days=7.0)
    access_token = create_access_token(data={'sub':user.username}, expires_delta=delta)

    response.set_cookie(
        key="access_token",
        value=access_token,
        # httponly=True,
        samesite="lax",
        secure=False
    )

    return "OK"

@auth_router.get('/me')
async def get_user_route(current_user: Annotated[User | None, Depends(current_user_from_cookie)]):
    logger.info(f"Current user: {current_user}")
    if current_user is None:
        return {
            "properties": {}
        }

    return {
        "properties": {
            "username":current_user.username,
            "email":current_user.email,
            "userid":current_user.db_id
        }
    }
