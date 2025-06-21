"""
Pydantic models for request/response schemas
"""
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SlitherResult(BaseModel):
    """Schema for Slither static analysis results"""
    findings: List[Dict] = Field(..., description="List of vulnerabilities found by Slither")
    summary: str = Field(..., description="Summary of static analysis results")
    severity_counts: Dict[str, int] = Field(..., description="Count of vulnerabilities by severity")


class VulnerabilityReport(BaseModel):
    """Individual vulnerability report"""
    title: str = Field(..., description="Vulnerability name/title")
    severity: str = Field(..., description="Severity level: HIGH/MEDIUM/LOW")
    description: str = Field(..., description="Detailed explanation of the vulnerability")
    fix_suggestion: str = Field(..., description="Specific recommendation to fix the issue")
    score_impact: int = Field(..., description="Impact on security score")
    line_numbers: Optional[List[int]] = Field(default=None, description="Affected code lines")


class AnalysisResult(BaseModel):
    """Final analysis result schema"""
    vulnerability_report: str = Field(..., description="Executive summary of security analysis")
    severity_score: int = Field(..., ge=0, le=100, description="Security score from 0-100")
    fix_suggestions: List[str] = Field(..., description="List of actionable fix suggestions")
    risk_breakdown: Dict[str, int] = Field(..., description="Count of vulnerabilities by risk level")
    timestamp: str = Field(..., description="Analysis timestamp")
    vulnerabilities: Optional[List[VulnerabilityReport]] = Field(default=None, description="Detailed vulnerability list")
    overall_risk: Optional[str] = Field(default=None, description="Overall risk assessment")


class AnalysisRequest(BaseModel):
    """Request schema for analysis"""
    contract_code: str = Field(..., description="Solidity contract source code")
    slither_results: Optional[SlitherResult] = Field(default=None, description="Optional Slither analysis results")
    include_detailed_report: bool = Field(default=True, description="Whether to include detailed vulnerability breakdown")


class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Current timestamp")
    openrouter_configured: bool = Field(..., description="Whether OpenRouter API is configured")
    version: str = Field(default="1.0.0", description="API version") 