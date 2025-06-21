#!/usr/bin/env python3
"""
Development server runner for Smart Contract Auditor API
"""
import uvicorn
import os
from config import settings

def main():
    print("🔧 Smart Contract Auditor - Backend Starting...")
    print("-" * 50)
    
    # Check for .env file
    if not os.path.exists('.env'):
        print("⚠️  No .env file found!")
        print("📋 To set up environment variables:")
        print("1. Copy env.example to .env:")
        print("   cp env.example .env")
        print("2. Edit .env and add your OpenRouter API key")
        print("3. Get your API key: https://openrouter.ai/keys")
        print()
    
    # Check configuration
    if not settings.validate():
        print("❌ Missing required environment variables!")
        print("\n⚡ Starting server anyway for testing...")
    else:
        print("✅ Configuration validated successfully")
    
    print(f"🌐 Server will start on: http://{settings.HOST}:{settings.PORT}")
    print(f"📖 API docs available at: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔄 Health check: http://{settings.HOST}:{settings.PORT}/health")
    print(f"🤖 Primary model: {settings.PRIMARY_MODEL}")
    print(f"🔧 Debug mode: {settings.DEBUG}")
    print("-" * 50)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,  # Only reload in debug mode
        log_level="debug" if settings.DEBUG else "info"
    )

if __name__ == "__main__":
    main() 