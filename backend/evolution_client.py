import httpx
import os
import logging
import base64
import asyncio

logger = logging.getLogger(__name__)

class EvolutionAPIClient:
    def __init__(self, base_url: str = None, api_key: str = None):
        self.base_url = (base_url or os.getenv("EVOLUTION_API_URL", "http://localhost:8080")).rstrip("/")
        self.api_key = api_key or os.getenv("EVOLUTION_API_KEY", "thelaaw_secret_key")
        self.instance = os.getenv("EVOLUTION_INSTANCE_NAME", "thelaaw_bot")

    def _normalize_number(self, number: str) -> str:
        """Ensure number is in international format without + prefix."""
        n = number.split("@")[0]  # strip JID suffix if any
        n = n.lstrip("+")
        return n

    async def send_presence(self, to: str, presence: str = "composing"):
        """Send typing indicator."""
        url = f"{self.base_url}/chat/sendPresence/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {"number": self._normalize_number(to), "presence": presence, "delay": 1200}
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                await client.post(url, json=payload, headers=headers)
            except Exception as e:
                logger.warning(f"Presence send failed (non-fatal): {e}")

    async def send_text(self, to: str, text: str):
        url = f"{self.base_url}/message/sendText/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {
            "number": self._normalize_number(to),
            "text": text,
            "delay": 1200
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if not response.is_success:
                    logger.error(f"Error sending WhatsApp text: HTTP {response.status_code} - {response.text}")
                    return None
                return response.json()
            except Exception as e:
                logger.error(f"Error sending WhatsApp text: {e}")
                return None

    async def send_media(self, to: str, media_url: str, caption: str = "", filename: str = "document.pdf"):
        url = f"{self.base_url}/message/sendMedia/{self.instance}"
        headers = {"apikey": self.api_key}
        payload = {
            "number": self._normalize_number(to),
            "mediatype": "document" if filename.endswith(".pdf") else "image",
            "media": media_url,
            "caption": caption,
            "fileName": filename,
            "delay": 1200
        }

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if not response.is_success:
                    logger.error(f"Error sending WhatsApp media: HTTP {response.status_code} - {response.text}")
                    return None
                return response.json()
            except Exception as e:
                logger.error(f"Error sending WhatsApp media: {e}")
                return None

    async def send_media_base64(self, to: str, pdf_bytes: bytes, filename: str, caption: str = ""):
        """Send a PDF directly as base64 without needing a public URL."""
        url = f"{self.base_url}/message/sendMedia/{self.instance}"
        headers = {"apikey": self.api_key}
        b64 = base64.b64encode(pdf_bytes).decode("utf-8")
        payload = {
            "number": self._normalize_number(to),
            "mediatype": "document",
            "media": f"data:application/pdf;base64,{b64}",
            "caption": caption,
            "fileName": filename,
            "delay": 1200,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                if not response.is_success:
                    logger.error(f"Error sending PDF: HTTP {response.status_code} - {response.text}")
                    return None
                return response.json()
            except Exception as e:
                logger.error(f"Error sending PDF base64: {e}")
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
