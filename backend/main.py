"""
Smart Contract Auditor - FastAPI Application
One main endpoint that handles the complete analysis pipeline
"""
import json
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from services.llm_service import LLMService
from utils.file_utils import read_uploaded_file

import subprocess
import os
import re

# Initialize FastAPI app
app = FastAPI(
    title="Smart Contract Auditor",
    description="AI-powered Solidity smart contract security analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM service
llm_service = LLMService()


def run_slither_analysis(solidity_code: str) -> dict:
    """
    Run Slither static analysis on the Solidity code
    
    TODO: MALTEEEE
    
    Args:
        solidity_code: The Solidity contract source code
        
    Returns:
        Dictionary with Slither analysis results
    """
    # PLACEHOLDER - Your friend will replace this with actual Slither integration

    def get_declared_solc_version(contents):
        # Look for a line like: pragma solidity ^0.8.0;
        m = re.match(r'^\s*pragma\s+solidity\s+([^;]+);', contents, flags=re.MULTILINE)
        if m:
            if m.group(1).strip()[0] == '^':
                return m.group(1).strip()[1:]
            else:
                return m.group(1).strip()
        return None
    
    declared = get_declared_solc_version(solidity_code)
    print(declared)

    # Inherit your current environment and add FORCE_COLOR
    env = os.environ.copy()
    env["FORCE_COLOR"] = "1"


    # Set solc version
    try:
        result = subprocess.run(
            ['solc-select', 'use', declared, '--always-install'],
            capture_output=True,
            text=True,
            env=env,
            check=True
        )

        print("=== STDOUT ===")
        print(result.stdout or "[No stdout output]")
        print("=== STDERR ===")
        print(result.stderr or "[No stderr output]")

    except subprocess.CalledProcessError as e:
        print("❌ Error:", e.stderr)

    try:
        result = subprocess.run(
            ['slither', filename, '--print', 'human-summary,contract-summary,data-dependency,inheritance,vars-and-auth,variable-order'],
            capture_output=True,
            text=True,
            env=env,
            check=True
        )

        print("=== STDOUT ===")
        print(result.stdout or "[No stdout output]")
        print("=== STDERR ===")
        print(result.stderr or "[No stderr output]")

    except subprocess.CalledProcessError as e:
        print("❌ Error:", e.stderr)
    


    return {
        "findings": [
            {
                "type": "reentrancy",
                "severity": "HIGH", 
                "description": "Potential reentrancy in withdraw function",
                "line": 23,
                "function": "withdraw"
            }
        ],
        "summary": "Placeholder Slither analysis - 1 high-severity issue found",
        "severity_counts": {"HIGH": 1, "MEDIUM": 0, "LOW": 0}
    }


@app.on_event("startup")
async def startup_event():
    """Validate configuration and display startup information"""
    print("🔧 Smart Contract Auditor - Backend Starting...")
    print("-" * 50)
    
    if not settings.validate():
        print("⚠️  Configuration validation failed!")
        print("🚀 Server starting anyway for development...")
    else:
        print("✅ Configuration validated successfully")
        print(f"🤖 Using primary model: {settings.PRIMARY_MODEL}")
    
    print(f"📊 LLM Service Available: {llm_service.is_available()}")
    print("-" * 50)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Smart Contract Auditor API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/analyze - Main analysis pipeline",
            "health": "/health - Service health check",
            "docs": "/docs - API documentation"
        }
    }


@app.post("/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    """
    Complete smart contract analysis pipeline
    
    This endpoint handles the full analysis workflow:
    1. File upload and validation
    2. Slither static analysis  
    3. Initial LLM code analysis
    4. Final combined LLM analysis
    5. Return comprehensive vulnerability report
    
    Args:
        file: Solidity file (.sol) to analyze
        
    Returns:
        Complete vulnerability analysis with scoring and recommendations
    """
    try:
        # Step 1: Read and validate uploaded file
        print("📁 Reading uploaded file...")
        solidity_code = await read_uploaded_file(file)
        print(f"✅ File validated: {len(solidity_code)} characters")
        
        # Step 2: Run Slither static analysis
        print("🔍 Running Slither static analysis...")
        slither_results = run_slither_analysis(file)
        print(f"✅ Slither analysis complete: {slither_results['summary']}")
        
        # Step 3: Run initial LLM analysis on the code
        print("🤖 Running initial LLM code analysis...")
        first_llm_analysis = await llm_service.first_analysis(solidity_code)
        print(f"✅ Initial LLM analysis complete - found {len(first_llm_analysis.get('vulnerabilities', []))} issues")
        
        # Step 4: Run final combined analysis
        print("🎯 Running final combined analysis...")
        slither_data_str = json.dumps(slither_results)
        final_analysis = await llm_service.final_analysis(slither_data_str, first_llm_analysis)
        print("✅ Final analysis complete")
        
        # Step 5: Format and return results
        vulnerabilities = final_analysis.get("vulnerabilities", [])
        
        # Calculate risk breakdown
        risk_breakdown = {
            "high": len([v for v in vulnerabilities if v.get("severity") == "HIGH"]),
            "medium": len([v for v in vulnerabilities if v.get("severity") == "MEDIUM"]),
            "low": len([v for v in vulnerabilities if v.get("severity") == "LOW"])
        }
        
        # Extract fix suggestions
        fix_suggestions = [v.get("fix_suggestion", "") for v in vulnerabilities if v.get("fix_suggestion")]
        if not fix_suggestions:
            fix_suggestions = final_analysis.get("recommendations", [])
        
        result = {
            "vulnerability_report": final_analysis.get("summary", "Analysis completed"),
            "security_score": final_analysis.get("security_score", 50),
            "overall_risk": final_analysis.get("overall_risk", "MEDIUM"),
            "fix_suggestions": fix_suggestions,
            "risk_breakdown": risk_breakdown,
            "vulnerabilities": vulnerabilities,
            "slither_findings": slither_results["findings"],
            "first_llm_analysis": first_llm_analysis,  # Include the structured first analysis
            "timestamp": datetime.now().isoformat(),
            "analysis_details": {
                "file_name": file.filename,
                "code_length": len(solidity_code),
                "slither_summary": slither_results["summary"],
                "llm_model_used": settings.PRIMARY_MODEL,
                "parsing_errors": {
                    "first_analysis": first_llm_analysis.get("parsing_error", False),
                    "final_analysis": final_analysis.get("parsing_error", False)
                }
            }
        }
        
        print("🎉 Analysis pipeline completed successfully!")
        return result
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring service status"""
    return {
        "status": "healthy" if llm_service.is_available() else "degraded",
        "timestamp": datetime.now().isoformat(),
        "openrouter_configured": bool(settings.OPENROUTER_API_KEY),
        "version": "1.0.0",
        "services": {
            "llm_service": llm_service.is_available(),
            "slither_integration": "placeholder_ready"  # Your friend can update this
        }
    }


@app.get("/test-slither")
async def test_slither():
    """Test endpoint for Slither integration - your friend can use this to test"""
    test_code = """
pragma solidity ^0.8.0;
contract TestContract {
    mapping(address => uint256) public balances;
    
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount; // Reentrancy vulnerability!
    }
}
"""
    
    try:
        slither_results = run_slither_analysis(test_code)
        return {
            "message": "Slither test successful",
            "test_code_length": len(test_code),
            "slither_results": slither_results
        }
    except Exception as e:
        return {
            "message": "Slither test failed",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 