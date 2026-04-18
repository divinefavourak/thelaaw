import httpx
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class SpitchAPIClient:
    """
    Client for Spitch.app API (Nigerian Language Transcription & TTS).
    Documentation: https://spitch.app/
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("SPITCH_API_KEY")
        # Base URL derived from standard SDK patterns, fallback to .env
        self.base_url = os.getenv("SPITCH_BASE_URL", "https://api.spitch.app/v1")

    async def transcribe(self, audio_file_path: str, language: str = "pcm") -> Optional[str]:
        """
        Transcribes a local audio file using Spitch.
        """
        if not self.api_key:
            logger.error("SPITCH_API_KEY missing")
            return None
            
        url = f"{self.base_url}/asr"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            try:
                with open(audio_file_path, "rb") as audio_file:
                    files = {"file": (os.path.basename(audio_file_path), audio_file, "audio/mpeg")}
                    data = {"language": language}
                    response = await client.post(url, files=files, data=data, headers=headers, timeout=60.0)
                    response.raise_for_status()
                    return response.json().get("text")
            except Exception as e:
                logger.error(f"Spitch Transcription Error: {e}")
                return None

    async def synthesize(self, text: str, voice: str = "aramide", language: str = "yo") -> Optional[str]:
        """
        Synthesizes text to speech using Spitch.
        Returns the URL of the generated audio file.
        """
        if not self.api_key:
            return None
            
        url = f"{self.base_url}/tts"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "text": text,
            "voice": voice,
            "language": language,
            "format": "mp3",
            "style": "conversational"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=30.0)
                response.raise_for_status()
                return response.json().get("audio_url")
            except Exception as e:
                logger.error(f"Spitch TTS Error: {e}")
                return None
