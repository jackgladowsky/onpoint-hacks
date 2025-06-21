"""
Scoring utilities for vulnerability assessment and security scoring
"""
from typing import Dict, List


# Vulnerability scoring weights
VULNERABILITY_WEIGHTS = {
    "reentrancy": -25,
    "access_control": -20,
    "integer_overflow": -15,
    "gas_abuse": -10,
    "logic_error": -10,
    "best_practice": -5
}

SEVERITY_MULTIPLIERS = {
    "HIGH": 1.0,
    "MEDIUM": 0.6,
    "LOW": 0.3
}


def calculate_security_score(vulnerabilities: List[Dict]) -> int:
    """
    Calculate security score based on vulnerabilities found
    
    Args:
        vulnerabilities: List of vulnerability dictionaries with severity and type
        
    Returns:
        Security score from 0-100 (100 = perfectly secure)
    """
    base_score = 100
    total_deduction = 0
    
    for vuln in vulnerabilities:
        severity = vuln.get("severity", "MEDIUM").upper()
        vuln_type = vuln.get("type", "best_practice").lower()
        
        # Get base deduction for vulnerability type
        base_deduction = VULNERABILITY_WEIGHTS.get(vuln_type, VULNERABILITY_WEIGHTS["best_practice"])
        
        # Apply severity multiplier
        severity_multiplier = SEVERITY_MULTIPLIERS.get(severity, SEVERITY_MULTIPLIERS["MEDIUM"])
        
        # Calculate final deduction
        deduction = abs(base_deduction * severity_multiplier)
        total_deduction += deduction
    
    # Calculate final score
    final_score = max(0, base_score - int(total_deduction))
    return min(100, final_score)


def categorize_risk_level(score: int) -> str:
    """
    Categorize overall risk level based on security score
    
    Args:
        score: Security score from 0-100
        
    Returns:
        Risk level: "LOW", "MEDIUM", or "HIGH"
    """
    if score >= 80:
        return "LOW"
    elif score >= 50:
        return "MEDIUM"
    else:
        return "HIGH"


def get_score_breakdown(vulnerabilities: List[Dict]) -> Dict[str, Dict]:
    """
    Get detailed breakdown of how the score was calculated
    
    Args:
        vulnerabilities: List of vulnerability dictionaries
        
    Returns:
        Dictionary with scoring breakdown details
    """
    breakdown = {
        "base_score": 100,
        "total_deductions": 0,
        "vulnerability_impacts": [],
        "final_score": 0
    }
    
    total_deduction = 0
    
    for vuln in vulnerabilities:
        severity = vuln.get("severity", "MEDIUM").upper()
        vuln_type = vuln.get("type", "best_practice").lower()
        title = vuln.get("title", "Unknown Vulnerability")
        
        # Calculate impact
        base_deduction = VULNERABILITY_WEIGHTS.get(vuln_type, VULNERABILITY_WEIGHTS["best_practice"])
        severity_multiplier = SEVERITY_MULTIPLIERS.get(severity, SEVERITY_MULTIPLIERS["MEDIUM"])
        impact = abs(base_deduction * severity_multiplier)
        
        total_deduction += impact
        
        breakdown["vulnerability_impacts"].append({
            "title": title,
            "severity": severity,
            "type": vuln_type,
            "base_deduction": base_deduction,
            "severity_multiplier": severity_multiplier,
            "final_impact": impact
        })
    
    breakdown["total_deductions"] = total_deduction
    breakdown["final_score"] = max(0, min(100, 100 - int(total_deduction)))
    
    return breakdown


def get_severity_distribution(vulnerabilities: List[Dict]) -> Dict[str, int]:
    """
    Get distribution of vulnerabilities by severity
    
    Args:
        vulnerabilities: List of vulnerability dictionaries
        
    Returns:
        Dictionary with counts by severity level
    """
    distribution = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    
    for vuln in vulnerabilities:
        severity = vuln.get("severity", "MEDIUM").upper()
        if severity in distribution:
            distribution[severity] += 1
    
    return distribution 