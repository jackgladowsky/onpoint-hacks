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


def run_slither_analysis(solidity_code) -> dict:
    """
    Run Slither static analysis on the Solidity code
    
    TODO: MALTEEEE
    
    Args:
        solidity_code: The Solidity contract source code
        
    Returns:
        Dictionary with Slither analysis results
    """
    # PLACEHOLDER - Your friend will replace this with actual Slither integration
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
    2. Combine all files into a single analysis context
    3. Single LLM analysis of all files together
    4. Generate code fixes for each vulnerability found
    5. Return comprehensive vulnerability report for all files
    
    Args:
        files: List of Solidity files (.sol) to analyze
        
    Returns:
        Complete vulnerability analysis with scoring and recommendations for all files
    """
    try:
        # Validate number of files
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per request")
        
        print(f"📁 Reading and validating {len(files)} files...")
        
        # Step 1: Read and validate all uploaded files
        file_contents = []
        file_names = []
        
        for file in files:
            solidity_code = await read_uploaded_file(file)
            file_contents.append(solidity_code)
            file_names.append(file.filename)
            print(f"✅ File validated: {file.filename} ({len(solidity_code)} characters)")
        
        # Step 2: Combine all files for analysis
        print("🔗 Combining files for analysis...")
        combined_analysis = await llm_service.analyze_multiple_files(file_contents, file_names)
        print("✅ Combined analysis complete")
        
        # Step 3: Generate code fixes for each vulnerability
        print("🔧 Generating code fixes for vulnerabilities...")
        updated_results = []
        
        for file_result in combined_analysis.get("individual_results", []):
            updated_vulnerabilities = []
            
            # Find the corresponding file content
            file_name = file_result.get("file_name", "")
            file_content = ""
            for i, name in enumerate(file_names):
                if name == file_name:
                    file_content = file_contents[i]
                    break
            
            for vulnerability in file_result.get("vulnerabilities", []):
                try:
                    print(f"  🔍 Generating fix for: {vulnerability.get('title', 'Unknown')} in {file_name}")
                    code_fix = await llm_service.generate_code_fixes(file_content, vulnerability)
                    vulnerability["code_fix"] = code_fix
                    print(f"  ✅ Code fix generated for: {vulnerability.get('title', 'Unknown')}")
                except Exception as e:
                    print(f"  ⚠️ Failed to generate code fix for {vulnerability.get('title', 'Unknown')}: {str(e)}")
                    # Continue without code fix if generation fails
                
                updated_vulnerabilities.append(vulnerability)
            
            file_result["vulnerabilities"] = updated_vulnerabilities
            updated_results.append(file_result)
        
        # Also generate code fixes for all_vulnerabilities
        updated_all_vulnerabilities = []
        for vulnerability in combined_analysis.get("all_vulnerabilities", []):
            # Find the corresponding file content
            file_name = vulnerability.get("file_name", "")
            file_content = ""
            for i, name in enumerate(file_names):
                if name == file_name:
                    file_content = file_contents[i]
                    break
            
            if file_content:  # Only generate if we found the file
                try:
                    code_fix = await llm_service.generate_code_fixes(file_content, vulnerability)
                    vulnerability["code_fix"] = code_fix
                except Exception as e:
                    print(f"  ⚠️ Failed to generate code fix for {vulnerability.get('title', 'Unknown')}: {str(e)}")
            
            updated_all_vulnerabilities.append(vulnerability)
        
        combined_analysis["individual_results"] = updated_results
        combined_analysis["all_vulnerabilities"] = updated_all_vulnerabilities
        
        print("✅ Code fixes generation complete")
        
        # Step 4: Format and return results in the expected format
        result = {
            "summary": combined_analysis.get("summary", "Analysis completed"),
            "project_metrics": {
                "total_files": len(files),
                "successful_analyses": len(files),
                "failed_analyses": 0,
                "average_security_score": combined_analysis.get("average_security_score", 50),
                "overall_project_risk": combined_analysis.get("overall_risk", "MEDIUM"),
                "total_vulnerabilities": len(combined_analysis.get("all_vulnerabilities", [])),
                "aggregate_risk_breakdown": combined_analysis.get("risk_breakdown", {"high": 0, "medium": 0, "low": 0})
            },
            "individual_results": combined_analysis.get("individual_results", []),
            "all_vulnerabilities": combined_analysis.get("all_vulnerabilities", []),
            "timestamp": datetime.now().isoformat(),
            "analysis_details": {
                "llm_model_used": settings.PRIMARY_MODEL,
                "files_analyzed": file_names
            }
        }
        
        print("🎉 Analysis pipeline with code fixes completed successfully!")
        return result
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze-multiple")
async def analyze_multiple_contracts(files: List[UploadFile] = File(...)):
    """
    Analyze multiple smart contracts in a single request
    
    This endpoint handles the analysis of multiple contracts:
    1. Validates all uploaded files
    2. Analyzes each contract individually
    3. Provides a combined risk assessment
    4. Returns individual and aggregate results
    
    Args:
        files: List of Solidity files (.sol) to analyze
        
    Returns:
        Comprehensive analysis results for all contracts with aggregate metrics
    """
    try:
        # Validate number of files
        if len(files) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per request")
        
        print(f"📁 Analyzing {len(files)} files...")
        
        # Analyze each file
        individual_results = []
        all_vulnerabilities = []
        total_score = 0
        
        for idx, file in enumerate(files):
            print(f"🔍 Analyzing file {idx + 1}/{len(files)}: {file.filename}")
            
            try:
                # Read and validate file
                solidity_code = await read_uploaded_file(file)
                
                # Run Slither analysis
                slither_results = run_slither_analysis(solidity_code)
                
                # Run initial LLM analysis
                first_llm_analysis = await llm_service.first_analysis(solidity_code)
                
                # Run final combined analysis
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
        summary_report = f"""Project Analysis Summary:
- Analyzed {len(files)} contracts
- Average Security Score: {average_score:.1f}/100
- Overall Project Risk: {overall_project_risk}
- Total Vulnerabilities: {len(all_vulnerabilities)}
  - High: {total_risk_breakdown['high']}
  - Medium: {total_risk_breakdown['medium']}
  - Low: {total_risk_breakdown['low']}
"""
        
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
                "files_analyzed": [f.filename for f in files]
            }
        }
        
        print("🎉 Multi-file analysis completed successfully!")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Multi-file analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Multi-file analysis failed: {str(e)}")


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


@app.post("/debug-upload")
async def debug_upload(files: List[UploadFile] = File(...)):
    """Debug endpoint to test file upload without running analysis"""
    try:
        print(f"🔍 Debug: Received {len(files)} files")
        
        file_info = []
        for i, file in enumerate(files):
            # Read file content
            content = await read_uploaded_file(file)
            file_info.append({
                "index": i,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(content),
                "first_100_chars": content[:100] if content else "No content"
            })
            print(f"📁 File {i}: {file.filename} ({len(content)} chars)")
        
        return {
            "message": "File upload test successful",
            "files_received": len(files),
            "file_details": file_info
        }
    except Exception as e:
        print(f"❌ Debug upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug upload failed: {str(e)}")


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