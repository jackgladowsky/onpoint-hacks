"""
Smart Contract Auditor - FastAPI Application
One main endpoint that handles the complete analysis pipeline
"""
import json
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from typing import List
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


def run_slither_analysis(file: UploadFile = File(...)) -> dict:
    """
    Run Slither static analysis on the Solidity code
    
    TODO: MALTEEEE
    
    Args:
        solidity_code: The Solidity contract source code
        
    Returns:
        Dictionary with Slither analysis results
    """
    # PLACEHOLDER - Your friend will replace this with actual Slither integration

    def get_declared_solc_version(filename):
        # Look for a line like: pragma solidity ^0.8.0;
        m = re.match(r'^\s*pragma\s+solidity\s+([^;]+);', filename, flags=re.MULTILINE)
        if m:
            if m.group(1).strip()[0] == '^':
                return m.group(1).strip()[1:]
            else:
                return m.group(1).strip()
        return None
    
    declared = get_declared_solc_version(file.filename)
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
            ['slither', file.filename, '--print', 'human-summary,contract-summary,data-dependency,inheritance,vars-and-auth,variable-order'],
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
            "analyze": "/analyze - Single file analysis",
            "analyze_multiple": "/analyze-multiple - Multiple file analysis",
            "health": "/health - Service health check",
            "docs": "/docs - API documentation"
        }
    }


@app.post("/analyze")
async def analyze_contract(files: List[UploadFile] = File(...)):
    """
    Complete smart contract analysis pipeline for multiple files
    
    This endpoint handles the full analysis workflow:
    1. File upload and validation for multiple files
    2. Individual analysis of each file using Slither + LLM pipeline
    3. Aggregate results and provide comprehensive vulnerability report
    
    Args:
        files: List of Solidity files (.sol) to analyze
        
    Returns:
        Complete vulnerability analysis with scoring and recommendations for all files
    """
    try:
        # Validate number of files
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per request")
        
        print(f"📁 Analyzing {len(files)} files with complete pipeline...")
        
        # Analyze each file using the complete pipeline
        individual_results = []
        all_vulnerabilities = []
        total_score = 0
        
        for idx, file in enumerate(files):
            print(f"🔍 Analyzing file {idx + 1}/{len(files)}: {file.filename}")
            
            try:
                # Read and validate file
                solidity_code = await read_uploaded_file(file)
                print(f"✅ File validated: {file.filename} ({len(solidity_code)} characters)")
                
                # Run Slither analysis
                print(f"🔧 Running Slither analysis on {file.filename}...")
                slither_results = run_slither_analysis(solidity_code)
                
                # Run initial LLM analysis
                print(f"🤖 Running initial LLM analysis on {file.filename}...")
                first_llm_analysis = await llm_service.first_analysis(solidity_code)
                
                # Run final combined analysis
                print(f"🔬 Running final combined analysis on {file.filename}...")
                slither_data_str = json.dumps(slither_results)
                final_analysis = await llm_service.final_analysis(slither_data_str, first_llm_analysis)
                
                # Extract vulnerabilities
                vulnerabilities = final_analysis.get("vulnerabilities", [])
                security_score = final_analysis.get("security_score", 50)
                
                # Add file context to vulnerabilities
                for vuln in vulnerabilities:
                    vuln["file_name"] = file.filename
                
                all_vulnerabilities.extend(vulnerabilities)
                total_score += security_score
                
                # Store individual result
                individual_results.append({
                    "file_name": file.filename,
                    "security_score": security_score,
                    "overall_risk": final_analysis.get("overall_risk", "MEDIUM"),
                    "vulnerabilities": vulnerabilities,
                    "vulnerability_count": len(vulnerabilities),
                    "risk_breakdown": {
                        "high": len([v for v in vulnerabilities if v.get("severity") == "HIGH"]),
                        "medium": len([v for v in vulnerabilities if v.get("severity") == "MEDIUM"]),
                        "low": len([v for v in vulnerabilities if v.get("severity") == "LOW"])
                    }
                })
                
                print(f"✅ Analysis complete for {file.filename}: Score {security_score}/100, {len(vulnerabilities)} vulnerabilities")
                
            except Exception as e:
                print(f"❌ Failed to analyze {file.filename}: {str(e)}")
                individual_results.append({
                    "file_name": file.filename,
                    "error": str(e),
                    "security_score": 0,
                    "overall_risk": "ERROR",
                    "vulnerabilities": [],
                    "vulnerability_count": 0,
                    "risk_breakdown": {"high": 0, "medium": 0, "low": 0}
                })
        
        # Calculate aggregate metrics
        successful_analyses = [r for r in individual_results if "error" not in r]
        average_score = total_score / len(successful_analyses) if successful_analyses else 0
        
        # Aggregate risk breakdown
        total_risk_breakdown = {
            "high": sum(r["risk_breakdown"]["high"] for r in individual_results),
            "medium": sum(r["risk_breakdown"]["medium"] for r in individual_results),
            "low": sum(r["risk_breakdown"]["low"] for r in individual_results)
        }
        
        # Determine overall project risk
        if total_risk_breakdown["high"] > 0:
            overall_project_risk = "HIGH"
        elif total_risk_breakdown["medium"] > 2:
            overall_project_risk = "MEDIUM-HIGH"
        elif total_risk_breakdown["medium"] > 0:
            overall_project_risk = "MEDIUM"
        elif total_risk_breakdown["low"] > 2:
            overall_project_risk = "LOW-MEDIUM"
        else:
            overall_project_risk = "LOW"
        
        # Generate summary report
        summary_report = f"""Analysis Summary:
        - Analyzed {len(files)} contracts using complete pipeline (Slither + LLM)
        - Average Security Score: {average_score:.1f}/100
        - Overall Project Risk: {overall_project_risk}
        - Total Vulnerabilities: {len(all_vulnerabilities)}
        - High: {total_risk_breakdown['high']}
        - Medium: {total_risk_breakdown['medium']}
        - Low: {total_risk_breakdown['low']}
        """
        
        # Format and return results in the expected format
        result = {
            "summary": summary_report,
            "project_metrics": {
                "total_files": len(files),
                "successful_analyses": len(successful_analyses),
                "failed_analyses": len(files) - len(successful_analyses),
                "average_security_score": round(average_score, 1),
                "overall_project_risk": overall_project_risk,
                "total_vulnerabilities": len(all_vulnerabilities),
                "aggregate_risk_breakdown": total_risk_breakdown
            },
            "individual_results": individual_results,
            "all_vulnerabilities": all_vulnerabilities,
            "timestamp": datetime.now().isoformat(),
            "analysis_details": {
                "llm_model_used": settings.PRIMARY_MODEL,
                "files_analyzed": [f.filename for f in files],
                "analysis_type": "complete_pipeline"
            }
        }
        
        print("🎉 Complete analysis pipeline completed successfully!")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 