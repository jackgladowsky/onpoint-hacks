"""
Configuration settings for the Smart Contract Auditor backend
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    # OpenRouter API configuration
    OPENROUTER_API_KEY: Optional[str] = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # LLM Model settings
    PRIMARY_MODEL: str = os.getenv("PRIMARY_MODEL", "anthropic/claude-3.5-sonnet")
    FALLBACK_MODEL: str = os.getenv("FALLBACK_MODEL", "openai/gpt-4o-mini")
    
    # Analysis settings
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "1048576"))  # 1MB default
    MAX_TOKENS_FIRST_ANALYSIS: int = int(os.getenv("MAX_TOKENS_FIRST_ANALYSIS", "2000"))
    MAX_TOKENS_FINAL_ANALYSIS: int = int(os.getenv("MAX_TOKENS_FINAL_ANALYSIS", "3000"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.1"))
    
    # CORS settings
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required settings are present"""
        if not cls.OPENROUTER_API_KEY:
            print("❌ OPENROUTER_API_KEY not found in environment variables")
            print("💡 Create a .env file with your API key:")
            print("   OPENROUTER_API_KEY=your_key_here")
            print("💡 Or get your API key from: https://openrouter.ai/keys")
            return False
        return True

settings = Settings() 