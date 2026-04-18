import os

IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"

MODELS = {
    "intake":     "claude-sonnet-4-6"          if IS_PROD else "claude-haiku-4-5-20251001",
    "research":   "claude-haiku-4-5-20251001",
    "reasoning":  "claude-opus-4-7"            if IS_PROD else "claude-sonnet-4-6",
    "drafting":   "claude-opus-4-7"            if IS_PROD else "claude-sonnet-4-6",
    "escalation": "claude-haiku-4-5-20251001",
}
