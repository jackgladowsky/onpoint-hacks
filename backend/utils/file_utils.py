"""
File utilities for handling Solidity files and validation
"""
import re
from fastapi import UploadFile, HTTPException

from config import settings


def validate_solidity_file(content: str) -> bool:
    """
    Validate Solidity file content
    
    Args:
        content: The file content as string
        
    Returns:
        True if valid
        
    Raises:
        HTTPException: If validation fails
    """
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="File content is empty")
    
    # Check for basic Solidity syntax
    if not re.search(r'pragma\s+solidity|contract\s+\w+|interface\s+\w+|library\s+\w+', content, re.IGNORECASE):
        raise HTTPException(
            status_code=400, 
            detail="File does not appear to be valid Solidity code"
        )
    
    # Check file size (content length)
    if len(content.encode('utf-8')) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE} bytes"
        )
    
    return True


async def read_uploaded_file(file: UploadFile) -> str:
    """
    Read and validate uploaded Solidity file
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        File content as string
        
    Raises:
        HTTPException: If file is invalid or cannot be read
    """
    # Validate file extension
    if not file.filename or not file.filename.endswith('.sol'):
        raise HTTPException(status_code=400, detail="Only .sol files are supported")
    
    try:
        # Read file content
        content = await file.read()
        
        # Validate file size
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Max size: {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Decode content
        solidity_code = content.decode('utf-8')
        
        # Validate Solidity content
        validate_solidity_file(solidity_code)
        
        return solidity_code
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file encoding. Please use UTF-8."
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")


def get_contract_name(content: str) -> str:
    """
    Extract contract name from Solidity code
    
    Args:
        content: Solidity source code
        
    Returns:
        Contract name or "Unknown" if not found
    """
    match = re.search(r'contract\s+(\w+)', content, re.IGNORECASE)
    return match.group(1) if match else "Unknown"


def estimate_complexity(content: str) -> str:
    """
    Estimate code complexity based on simple metrics
    
    Args:
        content: Solidity source code
        
    Returns:
        Complexity level: "LOW", "MEDIUM", or "HIGH"
    """
    lines = len(content.split('\n'))
    functions = len(re.findall(r'function\s+\w+', content, re.IGNORECASE))
    
    if lines < 50 and functions < 5:
        return "LOW"
    elif lines < 200 and functions < 15:
        return "MEDIUM"
    else:
        return "HIGH" 