#!/usr/bin/env python3
"""
Test script to verify the backend integration
"""
import requests
import json
import sys
import time

API_BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint working: {data['message']}")
            print(f"   Available endpoints: {list(data['endpoints'].keys())}")
            return True
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

def test_single_file_analysis():
    """Test single file analysis with a mock contract"""
    print("🔍 Testing single file analysis...")
    
    # Create a simple test contract
    test_contract = '''
pragma solidity ^0.8.0;

contract TestContract {
    uint256 public value;
    
    function setValue(uint256 _value) public {
        value = _value;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}
'''
    
    try:
        # Create a temporary file-like object
        files = {
            'file': ('test.sol', test_contract, 'text/plain')
        }
        
        response = requests.post(f"{API_BASE_URL}/analyze", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Single file analysis passed")
            print(f"   Security score: {data.get('security_score', 'N/A')}")
            print(f"   Overall risk: {data.get('overall_risk', 'N/A')}")
            print(f"   Vulnerabilities found: {len(data.get('vulnerabilities', []))}")
            return True
        else:
            print(f"❌ Single file analysis failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('detail', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Single file analysis failed: {e}")
        return False

def main():
    print("🚀 Testing Backend Integration")
    print("=" * 50)
    
    # Test endpoints
    tests = [
        ("Health Check", test_health_check),
        ("Root Endpoint", test_root_endpoint),
        ("Single File Analysis", test_single_file_analysis),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 30)
        if test_func():
            passed += 1
        time.sleep(1)  # Brief pause between tests
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Integration is working correctly.")
        return 0
    else:
        print("⚠️ Some tests failed. Check the backend server and configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())