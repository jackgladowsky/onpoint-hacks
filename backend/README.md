# Smart Contract Auditor - Backend

AI-powered Solidity smart contract security analysis with **one simple endpoint** that handles everything.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
# Copy the example environment file
cp env.example .env

# Edit .env and add your OpenRouter API key
# OPENROUTER_API_KEY=your_key_here
```
Get your API key from: https://openrouter.ai/keys

### 3. Run the Server
```bash
python run.py
```

The API will be available at:
- **Server**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🎯 Main Endpoint: `/analyze`

**One endpoint does everything:**

```bash
POST /analyze
```

**Complete Pipeline:**
1. 📁 **File Upload** - Validates and reads Solidity file
2. 🔍 **Slither Analysis** - Runs static analysis (your friend implements this)
3. 🤖 **Initial LLM** - AI analyzes the code for vulnerabilities  
4. 🎯 **Final LLM** - Combines Slither + LLM results into final report
5. 📊 **Return Results** - Complete vulnerability analysis with scoring

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "file=@your_contract.sol"
```

**Response:**
```json
{
  "vulnerability_report": "Executive summary...",
  "security_score": 75,
  "overall_risk": "MEDIUM",
  "fix_suggestions": ["Use ReentrancyGuard", "Add access controls"],
  "risk_breakdown": {"high": 1, "medium": 2, "low": 0},
  "vulnerabilities": [...],
  "slither_findings": [...],
  "timestamp": "2024-01-15T10:30:00",
  "analysis_details": {
    "file_name": "contract.sol",
    "code_length": 1250,
    "slither_summary": "Found 3 issues",
    "llm_model_used": "anthropic/claude-3.5-sonnet"
  }
}
```

## 🔧 For Your Friend's Slither Integration

**Step 1:** Find this function in `main.py`:
```python
def run_slither_analysis(solidity_code: str) -> dict:
    """
    TODO: Your friend will implement this function
    """
    # PLACEHOLDER - Replace with actual Slither integration
    return {
        "findings": [...],
        "summary": "Found X vulnerabilities", 
        "severity_counts": {"HIGH": 2, "MEDIUM": 1, "LOW": 0}
    }
```

**Step 2:** Replace with actual Slither code:
```python
def run_slither_analysis(solidity_code: str) -> dict:
    """Run actual Slither analysis"""
    
    # Your friend's Slither integration here
    # Example:
    # slither = Slither(solidity_code)
    # results = slither.run_detectors()
    
    return {
        "findings": [
            {
                "type": "reentrancy",
                "severity": "HIGH",
                "description": "Reentrancy in withdraw function", 
                "line": 23,
                "function": "withdraw"
            }
        ],
        "summary": f"Found {len(findings)} vulnerabilities",
        "severity_counts": {"HIGH": 1, "MEDIUM": 0, "LOW": 0}
    }
```

**Step 3:** Test with `/test-slither` endpoint:
```bash
GET /test-slither
# Tests the Slither integration with sample vulnerable code
```

## 📊 Scoring System

Security score starts at 100 and deducts points:

- **Reentrancy vulnerabilities**: -25 points
- **Access control issues**: -20 points  
- **Integer overflow/underflow**: -15 points
- **Gas abuse/DOS**: -10 points
- **Logic errors**: -10 points
- **Best practice violations**: -5 points each

## 🧪 Testing

**Test with sample contract:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -F "file=@test_contract.sol"
```

**Test Slither integration:**
```bash
curl "http://localhost:8000/test-slither"
```

**Health check:**
```bash
curl "http://localhost:8000/health"
```

## 🚀 Ready for Demo!

- ✅ **Single endpoint** handles complete pipeline
- ✅ **Clear integration point** for Slither 
- ✅ **Comprehensive output** with scoring and suggestions
- ✅ **Test endpoints** for development
- ✅ **Auto-docs** at `/docs`
- ✅ **Production logging** with step-by-step progress

## ⚙️ Environment Configuration

The backend uses a `.env` file for configuration. All settings are optional except `OPENROUTER_API_KEY`.

**Available Settings:**
```bash
# Required
OPENROUTER_API_KEY=your_key_here

# Optional - LLM Models  
PRIMARY_MODEL=anthropic/claude-3.5-sonnet
FALLBACK_MODEL=openai/gpt-4o-mini

# Optional - Analysis Settings
MAX_FILE_SIZE=1048576
MAX_TOKENS_FIRST_ANALYSIS=2000
MAX_TOKENS_FINAL_ANALYSIS=3000
TEMPERATURE=0.1

# Optional - Server Settings
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Optional - CORS (comma-separated)
ALLOWED_ORIGINS=*
```

Perfect for your hackathon timeline! 🎯 