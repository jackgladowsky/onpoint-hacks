"""
LLM Service for handling OpenRouter API interactions
Simplified for direct use in the analysis pipeline
"""
import json
import re
from typing import Dict
from openai import OpenAI
from fastapi import HTTPException

from config import settings


class LLMService:
    """Simplified LLM service for smart contract analysis"""
    
    def __init__(self):
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize OpenRouter client if API key is available"""
        if settings.OPENROUTER_API_KEY:
            self.client = OpenAI(
                base_url=settings.OPENROUTER_BASE_URL,
                api_key=settings.OPENROUTER_API_KEY,
            )
            print("✅ OpenRouter client initialized")
        else:
            print("⚠️  OpenRouter client not initialized - API key missing")
    
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.client is not None
    
    async def first_analysis(self, solidity_code: str) -> Dict:
        """
        First LLM analysis of raw Solidity code - returns structured JSON
        """
        if not self.client:
            raise HTTPException(
                status_code=503, 
                detail="LLM service unavailable - API key not configured"
            )
        
        prompt = f"""
You are a security expert analyzing Solidity smart contracts. 

Analyze the following Solidity code for security vulnerabilities:

{solidity_code}

Focus on:
- Reentrancy attacks
- Integer overflow/underflow  
- Access control issues
- Gas optimization problems
- Logic errors
- Best practice violations

Return ONLY valid JSON in this exact format:
{{
    "vulnerabilities": [
        {{
            "title": "Vulnerability name",
            "severity": "HIGH/MEDIUM/LOW",
            "description": "Detailed explanation",
            "line_numbers": [23, 24],
            "potential_impact": "Business/financial impact",
            "type": "reentrancy/access_control/integer_overflow/gas_abuse/logic_error/best_practice"
        }}
    ],
    "summary": "Brief overview of findings",
    "total_issues": 3,
    "risk_assessment": "HIGH/MEDIUM/LOW"
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.PRIMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.MAX_TOKENS_FIRST_ANALYSIS,
                temperature=settings.TEMPERATURE
            )
            
            # Parse and validate JSON response
            result = self._parse_json_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Try fallback model
            try:
                response = self.client.chat.completions.create(
                    model=settings.FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=settings.MAX_TOKENS_FIRST_ANALYSIS,
                    temperature=settings.TEMPERATURE
                )
                result = self._parse_json_response(response.choices[0].message.content)
                return result
            except Exception:
                raise HTTPException(
                    status_code=500, 
                    detail=f"LLM Analysis failed: {str(e)}"
                )

    async def final_analysis(self, slither_results: str, llm_analysis: Dict) -> Dict:
        """
        Final analysis combining Slither + LLM results
        """
        if not self.client:
            raise HTTPException(
                status_code=503, 
                detail="LLM service unavailable - API key not configured"
            )
        
        # Convert llm_analysis dict to string for the prompt
        llm_analysis_str = json.dumps(llm_analysis, indent=2)
        
        prompt = f"""
You are a senior smart contract auditor creating a comprehensive security report.

INPUTS:
1. Static Analysis (Slither): {slither_results}
2. Initial LLM Analysis: {llm_analysis_str}

Create a final audit report that:

1. CONSOLIDATES findings from both analyses
2. PRIORITIZES vulnerabilities by severity and impact
3. PROVIDES clear fix suggestions
4. ASSIGNS a security score (0-100, where 100 = perfectly secure)

SCORING CRITERIA:
- Reentrancy vulnerabilities: -25 points
- Access control issues: -20 points  
- Integer overflow/underflow: -15 points
- Gas abuse/DOS: -10 points
- Logic errors: -10 points
- Best practice violations: -5 points each

Return ONLY valid JSON in this exact format:
{{
    "summary": "Executive summary of security posture",
    "vulnerabilities": [
        {{
            "title": "Vulnerability name",
            "severity": "HIGH/MEDIUM/LOW", 
            "description": "Clear explanation",
            "fix_suggestion": "Specific code fix",
            "score_impact": -25,
            "line_numbers": [23, 24],
            "type": "reentrancy/access_control/etc"
        }}
    ],
    "security_score": 75,
    "overall_risk": "HIGH/MEDIUM/LOW",
    "recommendations": ["List of actionable recommendations"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.PRIMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.MAX_TOKENS_FINAL_ANALYSIS,
                temperature=settings.TEMPERATURE
            )
            
            # Parse and validate JSON response
            result = self._parse_json_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Try fallback model
            try:
                response = self.client.chat.completions.create(
                    model=settings.FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=settings.MAX_TOKENS_FINAL_ANALYSIS,
                    temperature=settings.TEMPERATURE
                )
                result = self._parse_json_response(response.choices[0].message.content)
                return result
            except Exception:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Final analysis failed: {str(e)}"
                )
    
    def _parse_json_response(self, content: str) -> Dict:
        """Parse and validate JSON from LLM response, handling various formats"""
        print(f"🔍 Parsing LLM response ({len(content)} chars)")
        
        # First, try direct JSON parsing
        try:
            result = json.loads(content)
            print("✅ Direct JSON parsing successful")
            return result
        except json.JSONDecodeError:
            print("⚠️  Direct JSON parsing failed, trying extraction...")
        
        # Try to extract JSON from response if it's wrapped in other text
        try:
            # Look for JSON between ```json and ``` 
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(1))
                print("✅ JSON extracted from code blocks")
                return result
            
            # Look for JSON between { and } (find the largest JSON object)
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(1))
                print("✅ JSON extracted from braces")
                return result
                
        except json.JSONDecodeError as e:
            print(f"❌ JSON extraction failed: {e}")
        
        # If all else fails, return a basic error structure
        print("⚠️  Using fallback JSON structure")
        return {
            "summary": "Failed to parse LLM response properly - invalid JSON format",
            "vulnerabilities": [],
            "security_score": 50,
            "overall_risk": "MEDIUM",
            "recommendations": ["Unable to parse detailed recommendations - LLM returned invalid JSON"],
            "parsing_error": True,
            "raw_response_preview": content[:200] + "..." if len(content) > 200 else content
        }

    async def analyze_multiple_files(self, file_contents: list, file_names: list) -> Dict:
        """
        Analyze multiple files in a single LLM call by concatenating them
        
        Args:
            file_contents: List of Solidity code strings
            file_names: List of corresponding file names
            
        Returns:
            Combined analysis results for all files
        """
        if not self.client:
            raise HTTPException(
                status_code=503, 
                detail="LLM service unavailable - API key not configured"
            )
        
        # Concatenate all files with clear separators
        combined_code = ""
        for i, (file_name, code) in enumerate(zip(file_names, file_contents)):
            combined_code += f"\n\n{'='*60}\n"
            combined_code += f"FILE {i+1}: {file_name}\n"
            combined_code += f"{'='*60}\n\n"
            combined_code += code
        
        prompt = f"""
You are a security expert analyzing multiple Solidity smart contracts as a cohesive project.

Analyze the following Solidity contracts for security vulnerabilities and provide both individual file analysis and project-level insights:

{combined_code}

ANALYSIS REQUIREMENTS:
1. Analyze each file individually for vulnerabilities
2. Look for cross-contract vulnerabilities and interactions
3. Provide project-level risk assessment
4. Focus on:
   - Reentrancy attacks
   - Integer overflow/underflow  
   - Access control issues
   - Gas optimization problems
   - Logic errors
   - Best practice violations
   - Cross-contract interaction issues

SCORING CRITERIA (per file):
- Reentrancy vulnerabilities: -25 points
- Access control issues: -20 points  
- Integer overflow/underflow: -15 points
- Gas abuse/DOS: -10 points
- Logic errors: -10 points
- Best practice violations: -5 points each

Return ONLY valid JSON in this exact format:
{{
    "summary": "Executive summary of the entire project's security posture",
    "overall_risk": "HIGH/MEDIUM/LOW",
    "average_security_score": 75,
    "risk_breakdown": {{
        "high": 2,
        "medium": 3,
        "low": 1
    }},
    "individual_results": [
        {{
            "file_name": "Token.sol",
            "security_score": 75,
            "overall_risk": "MEDIUM",
            "vulnerabilities": [
                {{
                    "title": "Vulnerability name",
                    "severity": "HIGH/MEDIUM/LOW",
                    "description": "Detailed explanation",
                    "fix_suggestion": "Specific code fix",
                    "score_impact": -25,
                    "line_numbers": [23, 24],
                    "type": "reentrancy/access_control/etc",
                    "file_name": "Token.sol"
                }}
            ],
            "risk_breakdown": {{
                "high": 1,
                "medium": 1,
                "low": 0
            }}
        }}
    ],
    "all_vulnerabilities": [
        {{
            "title": "Vulnerability name",
            "severity": "HIGH/MEDIUM/LOW",
            "description": "Detailed explanation",
            "fix_suggestion": "Specific code fix",
            "score_impact": -25,
            "line_numbers": [23, 24],
            "type": "reentrancy/access_control/etc",
            "file_name": "Token.sol"
        }}
    ],
    "cross_contract_issues": [
        {{
            "title": "Cross-contract vulnerability",
            "description": "Issue involving multiple contracts",
            "affected_files": ["Token.sol", "Staking.sol"],
            "severity": "HIGH/MEDIUM/LOW",
            "fix_suggestion": "How to fix across contracts"
        }}
    ],
    "recommendations": ["Project-level recommendations"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.PRIMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.MAX_TOKENS_FINAL_ANALYSIS * 2,  # Double the tokens for multiple files
                temperature=settings.TEMPERATURE
            )
            
            # Parse and validate JSON response
            result = self._parse_json_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
            # Try fallback model
            try:
                response = self.client.chat.completions.create(
                    model=settings.FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=settings.MAX_TOKENS_FINAL_ANALYSIS * 2,
                    temperature=settings.TEMPERATURE
                )
                result = self._parse_json_response(response.choices[0].message.content)
                return result
            except Exception:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Multiple file analysis failed: {str(e)}"
                ) 