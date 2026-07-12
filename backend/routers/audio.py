from fastapi import APIRouter, Request, File
from uuid import uuid4
from typing import Annotated
import os
import requests
from loguru import logger
import json

TRANSCRIPTION_ENDPOINT = "https://api.sarvam.ai/speech-to-text"
AUDIO_DIR="audio"

SARVAM_API_KEY=os.environ.get("SARVAM_API_KEY", "")
if SARVAM_API_KEY == "":
    raise ValueError("SARVAM_API_KEY not defined in environment varibles")

audio_router = APIRouter(tags=['audio'], prefix='/audio')

@audio_router.post('/transcribe')
def transcribe_request(file: Annotated[bytes, File()]):
    id = str(uuid4())
    filename = f"{AUDIO_DIR}/{id}"

    with open(f"{filename}.webm", "wb+") as f:
        f.write(file)

    with open(f"{filename}.webm", "rb") as f:
        response = requests.post(
            TRANSCRIPTION_ENDPOINT,
            files={
                "file": (f"audio-{id}.webm", f, "audio/webm")
            },
            headers={
                "api-subscription-key": SARVAM_API_KEY
            }
        )
        logger.info(f"Received transcription response: {response.text}")
    
    jres = json.loads(response.text)
    logger.info(f"From validated object: id: {jres['request_id']}, transcript: {jres['transcript']}")

    return {
        "transcription": jres['transcript']
    }