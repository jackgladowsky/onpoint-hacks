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
        Analyze multiple files and provide comprehensive analysis
        
        Args:
            file_contents: List of Solidity code strings
            file_names: List of corresponding file names
            
        Returns:
            Comprehensive analysis results for all files
        """
        if not self.client:
            raise HTTPException(
                status_code=503, 
                detail="LLM service unavailable - API key not configured"
            )
        
        # Combine all files for analysis context
        combined_content = ""
        for i, (content, name) in enumerate(zip(file_contents, file_names)):
            combined_content += f"\n\n// === FILE {i+1}: {name} ===\n{content}"
        
        prompt = f"""
You are a senior smart contract security auditor analyzing multiple Solidity files in a project.

FILES TO ANALYZE:
{combined_content}

Provide a comprehensive security analysis considering:
1. Individual file vulnerabilities
2. Cross-contract interactions and dependencies
3. Overall project security posture
4. Business logic flaws
5. Best practice violations

For EACH file, identify vulnerabilities and provide detailed analysis.

Return ONLY valid JSON in this exact format:
{{
    "summary": "Executive summary of the entire project's security status",
    "average_security_score": 75, 
    "overall_risk": "HIGH/MEDIUM/LOW",
    "total_vulnerabilities": 5,
    "risk_breakdown": {{"high": 2, "medium": 2, "low": 1}},
    "individual_results": [
        {{
            "file_name": "Contract1.sol",
            "security_score": 80,
            "overall_risk": "MEDIUM", 
            "vulnerability_count": 2,
            "risk_breakdown": {{"high": 0, "medium": 1, "low": 1}},
            "vulnerabilities": [
                {{
                    "title": "Vulnerability name",
                    "severity": "HIGH/MEDIUM/LOW",
                    "description": "Detailed explanation",
                    "fix_suggestion": "Specific code fix",
                    "line_numbers": [23, 24],
                    "type": "reentrancy/access_control/etc"
                }}
            ]
        }}
    ],
    "all_vulnerabilities": [
        {{
            "title": "Cross-contract vulnerability",
            "severity": "HIGH",
            "description": "Issue affecting multiple contracts",
            "fix_suggestion": "How to fix this issue",
            "file_name": "Contract1.sol",
            "line_numbers": [15, 16],
            "type": "access_control"
        }}
    ]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.PRIMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=settings.MAX_TOKENS_FINAL_ANALYSIS,
                temperature=settings.TEMPERATURE
            )
            
            result = self._parse_json_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
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
                    detail=f"Multi-file analysis failed: {str(e)}"
                )

    async def generate_code_fixes(self, solidity_code: str, vulnerability: Dict) -> Dict:
        """
        Generate vulnerable code snippet and fix for specific vulnerability
        
        Args:
            solidity_code: The original Solidity contract code
            vulnerability: Vulnerability details from analysis
            
        Returns:
            Dict containing vulnerable code snippet and fix snippet
        """
        if not self.client:
            raise HTTPException(
                status_code=503, 
                detail="LLM service unavailable - API key not configured"
            )
        
        vulnerability_info = f"""
Title: {vulnerability.get('title', 'Unknown')}
Type: {vulnerability.get('type', 'unknown')}
Severity: {vulnerability.get('severity', 'UNKNOWN')}
Description: {vulnerability.get('description', 'No description')}
Line Numbers: {vulnerability.get('line_numbers', [])}
"""

        prompt = f"""
You are a smart contract security expert. Given a vulnerability in Solidity code, extract the vulnerable code snippet and provide a clean fix.

ORIGINAL CONTRACT:
{solidity_code}

VULNERABILITY DETAILS:
{vulnerability_info}

Extract the vulnerable code section and provide a fixed version that users can copy.

Return ONLY valid JSON in this exact format:
{{
    "vulnerability_title": "{vulnerability.get('title', 'Unknown Vulnerability')}",
    "vulnerable_code": "// Vulnerable code snippet (10-15 lines max)\\nfunction withdraw() public {{\\n    // vulnerable implementation\\n}}",
    "fixed_code": "// Fixed code snippet (10-15 lines max)\\nfunction withdraw() public {{\\n    // secure implementation with proper checks\\n}}",
    "explanation": "Brief explanation of what was changed and why the fix works",
    "line_numbers": {vulnerability.get('line_numbers', [])}
}}

GUIDELINES:
- Keep code snippets concise (10-15 lines max)
- Include necessary context but focus on the vulnerability
- Show clear before/after comparison
- Use proper Solidity syntax
- Add helpful comments in the fixed version
"""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.PRIMARY_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,  # Shorter for code snippets
                temperature=0.1   # Lower temperature for more consistent code
            )
            
            result = self._parse_json_response(response.choices[0].message.content)
            return result
            
        except Exception as e:
            try:
                response = self.client.chat.completions.create(
                    model=settings.FALLBACK_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1500,
                    temperature=0.1
                )
                result = self._parse_json_response(response.choices[0].message.content)
                return result
            except Exception:
                # Return fallback response if LLM fails
                return {
                    "vulnerability_title": vulnerability.get('title', 'Unknown Vulnerability'),
                    "vulnerable_code": "// Code snippet unavailable - LLM service error",
                    "fixed_code": "// Fix unavailable - LLM service error", 
                    "explanation": "Unable to generate code fix due to service error",
                    "line_numbers": vulnerability.get('line_numbers', [])
                } 