"""
Analysis Service for orchestrating smart contract vulnerability analysis
"""
import json
from datetime import datetime
from typing import Dict, List, Optional

from models.schemas import AnalysisResult, SlitherResult, VulnerabilityReport
from .llm_service import LLMService
from utils.file_utils import validate_solidity_file
from utils.scoring import calculate_security_score


class AnalysisService:
    """Service for orchestrating complete smart contract analysis"""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    async def analyze_contract(
        self,
        solidity_code: str,
        slither_results: Optional[SlitherResult] = None,
        include_detailed_report: bool = True
    ) -> AnalysisResult:
        """
        Main analysis pipeline that orchestrates the complete vulnerability analysis
        
        Args:
            solidity_code: The Solidity contract source code
            slither_results: Optional Slither static analysis results
            include_detailed_report: Whether to include detailed vulnerability breakdown
            
        Returns:
            Complete analysis result with vulnerability report and scoring
        """
        # Validate input
        validate_solidity_file(solidity_code)
        
        # Step 1: First LLM Analysis
        first_analysis = await self.llm_service.first_analysis(solidity_code)
        
        # Step 2: Prepare Slither results
        slither_data = self._format_slither_results(slither_results)
        
        # Step 3: Final combined analysis
        final_result = await self.llm_service.final_analysis(slither_data, first_analysis)
        
        # Step 4: Process and format results
        return self._create_analysis_result(final_result, include_detailed_report)
    
    def _format_slither_results(self, slither_results: Optional[SlitherResult]) -> str:
        """
        Format Slither results for LLM consumption
        
        Args:
            slither_results: Optional Slither analysis results
            
        Returns:
            JSON string representation of Slither results
        """
        if slither_results:
            return json.dumps({
                "findings": slither_results.findings,
                "summary": slither_results.summary,
                "severity_counts": slither_results.severity_counts
            })
        else:
            return json.dumps({
                "findings": [],
                "summary": "No static analysis results provided",
                "severity_counts": {}
            })
    
    def _create_analysis_result(
        self, 
        final_result: Dict, 
        include_detailed_report: bool
    ) -> AnalysisResult:
        """
        Create the final analysis result from LLM output
        
        Args:
            final_result: Dictionary from final LLM analysis
            include_detailed_report: Whether to include detailed vulnerabilities
            
        Returns:
            Structured analysis result
        """
        vulnerabilities = final_result.get("vulnerabilities", [])
        
        # Calculate risk breakdown
        risk_breakdown = self._calculate_risk_breakdown(vulnerabilities)
        
        # Extract fix suggestions
        fix_suggestions = [v.get("fix_suggestion", "") for v in vulnerabilities if v.get("fix_suggestion")]
        if not fix_suggestions:
            fix_suggestions = final_result.get("recommendations", [])
        
        # Create detailed vulnerability reports if requested
        detailed_vulnerabilities = None
        if include_detailed_report:
            detailed_vulnerabilities = [
                VulnerabilityReport(
                    title=vuln.get("title", "Unknown Vulnerability"),
                    severity=vuln.get("severity", "MEDIUM"),
                    description=vuln.get("description", ""),
                    fix_suggestion=vuln.get("fix_suggestion", ""),
                    score_impact=vuln.get("score_impact", 0),
                    line_numbers=vuln.get("line_numbers")
                )
                for vuln in vulnerabilities
            ]
        
        return AnalysisResult(
            vulnerability_report=final_result.get("summary", "Analysis completed"),
            severity_score=final_result.get("security_score", 50),
            fix_suggestions=fix_suggestions,
            risk_breakdown=risk_breakdown,
            timestamp=datetime.now().isoformat(),
            vulnerabilities=detailed_vulnerabilities,
            overall_risk=final_result.get("overall_risk")
        )
    
    def _calculate_risk_breakdown(self, vulnerabilities: List[Dict]) -> Dict[str, int]:
        """
        Calculate breakdown of vulnerabilities by risk level
        
        Args:
            vulnerabilities: List of vulnerability dictionaries
            
        Returns:
            Dictionary with counts by risk level
        """
        breakdown = {"high": 0, "medium": 0, "low": 0}
        
        for vuln in vulnerabilities:
            severity = vuln.get("severity", "MEDIUM").lower()
            if severity == "high":
                breakdown["high"] += 1
            elif severity == "medium":
                breakdown["medium"] += 1
            elif severity == "low":
                breakdown["low"] += 1
        
        return breakdown
    
    def is_available(self) -> bool:
        """Check if analysis service is available"""
        return self.llm_service.is_available()
    
    def get_service_info(self) -> Dict:
        """Get information about service availability and configuration"""
        return {
            "llm_available": self.llm_service.is_available(),
            "supported_file_types": [".sol"],
            "max_file_size": "1MB",
            "analysis_stages": ["Initial LLM Analysis", "Static Analysis Integration", "Final Report Generation"]
        } 