import httpx
import os
import logging
import base64

logger = logging.getLogger(__name__)

class EvolutionAPIClient:
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or os.getenv("EVOLUTION_API_URL", "http://localhost:8080")).rstrip("/")
        self.api_key = api_key or os.getenv("EVOLUTION_API_KEY", "thelaaw_secret_key")
        self.instance = os.getenv("EVOLUTION_INSTANCE_NAME", "thelaaw_bot")

    async def send_text(self, to: str, text: str):
        url = f"{self.base_url}/message/sendText/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {
            "number": to,
            "options": {"delay": 1200, "presence": "composing", "linkPreview": False},
            "textMessage": {"text": text}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error sending WhatsApp text: {e}")
                return None

    async def send_media(self, to: str, media_url: str, caption: str = "", filename: str = "document.pdf"):
        url = f"{self.base_url}/message/sendMedia/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {
            "number": to,
            "media": media_url,
            "mediatype": "document" if filename.endswith(".pdf") else "image",
            "caption": caption,
            "fileName": filename
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error sending WhatsApp media: {e}")
                return None

    async def download_media(self, message_id: str) -> bytes:
        """
        Downloads media (image/audio/document) from Evolution API by message ID.
        """
        url = f"{self.base_url}/message/downloadMedia/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {"messageId": message_id}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                # Evolution API returns base64 string in a JSON field usually, or raw bytes
                data = response.json()
                if "base64" in data:
                    return base64.b64decode(data["base64"])
                return response.content
            except Exception as e:
                logger.error(f"Error downloading media: {e}")
                return None
