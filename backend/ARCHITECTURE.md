# Backend Architecture
```
backend/
├── main.py                # FastAPI app & routing (API interface only)
├── config.py              # Configuration & settings
├── run.py                 # Development server runner
├── requirements.txt       # Dependencies
├── models/                # Pydantic schemas & data models
│   ├── __init__.py
│   └── schemas.py
├── services/              # Business logic layer
│   ├── __init__.py
│   ├── llm_service.py     # OpenRouter LLM interactions
│   └── analysis_service.py # Main analysis orchestration
├── utils/                 # Helper utilities
│   ├── __init__.py
│   ├── file_utils.py      # File handling & validation
│   └── scoring.py         # Vulnerability scoring algorithms
└── test_contract.sol      # Test contract for development
```

## Architecture Principles

### 1. **Separation of Concerns**
- **`main.py`**: Pure FastAPI routing and HTTP interface
- **`services/`**: All business logic and orchestration
- **`models/`**: Data structures and schemas
- **`utils/`**: Reusable helper functions

### 2. **Dependency Injection**
- Services are initialized once and injected into routes
- Easy to mock for testing
- Clear dependency boundaries

### 3. **Error Handling**
- Centralized exception handling in FastAPI
- Service-level error handling with proper HTTP exceptions
- Graceful degradation when services are unavailable

## 🔧 Key Components

### **LLMService** (`services/llm_service.py`)
- Handles all OpenRouter API interactions
- Manages prompt templates and model fallbacks
- Robust JSON parsing with error recovery
- **Key Methods:**
  - `first_analysis()`: Initial code analysis
  - `final_analysis()`: Combined analysis with Slither results
  - `is_available()`: Service health check

### **AnalysisService** (`services/analysis_service.py`)
- Orchestrates the complete analysis pipeline
- Combines LLM and static analysis results
- Handles scoring and report generation
- **Key Methods:**
  - `analyze_contract()`: Main analysis pipeline
  - `get_service_info()`: Service capabilities

### **File Utilities** (`utils/file_utils.py`)
- Solidity file validation and parsing
- File size and encoding checks
- Contract metadata extraction

### **Scoring System** (`utils/scoring.py`)
- Vulnerability impact scoring algorithms
- Risk categorization logic
- Score breakdown calculations

## 🔗 Integration Points

### **For Slither Integration:**
Your friend can integrate by:

1. **Using the `SlitherResult` schema:**
```python
from models.schemas import SlitherResult

slither_data = SlitherResult(
    findings=[...],
    summary="Found X vulnerabilities",
    severity_counts={"HIGH": 2, "MEDIUM": 1}
)
```

2. **Calling the enhanced endpoint:**
```python
POST /analyze-with-slither
# With both file upload and slither_data
```

3. **Direct service integration:**
```python
from services import AnalysisService

analysis_service = AnalysisService()
result = await analysis_service.analyze_contract(
    solidity_code=code,
    slither_results=slither_data
)
```

## 🚀 Benefits of This Architecture

### **Maintainability**
- Clear separation makes code easier to understand
- Individual components can be modified independently
- Easy to add new analysis types or integrations

### **Testability**
- Each service can be unit tested in isolation
- Mock services easily for endpoint testing
- Clear interfaces for integration testing

### **Scalability**
- Services can be extracted to separate microservices
- Easy to add caching, queuing, or async processing
- Clear dependency boundaries

### **Developer Experience**
- FastAPI auto-documentation works perfectly
- Clear error messages and validation
- Type hints throughout for better IDE support

## 🧪 Testing Strategy

### **Unit Tests** (can be added)
```python
# Test individual services
def test_llm_service():
    service = LLMService()
    result = await service.first_analysis(code)
    assert result contains expected format

# Test utilities
def test_file_validation():
    assert validate_solidity_file(valid_code) == True
```

### **Integration Tests**
```python
# Test complete pipeline
def test_analysis_pipeline():
    service = AnalysisService()
    result = await service.analyze_contract(code)
    assert result.severity_score >= 0
```

### **API Tests**
```python
# Test FastAPI endpoints
def test_analyze_endpoint():
    response = client.post("/analyze", files={"file": test_file})
    assert response.status_code == 200
```

This architecture makes your backend production-ready, maintainable, and easy to extend! 🎯 