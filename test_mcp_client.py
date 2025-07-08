#!/usr/bin/env python3
"""
Test MCP client compatibility with our HTTP server
"""
import requests
import json

def test_mcp_server():
    url = "http://localhost:9091/mcp/"
    
    # Test 1: Basic tools/list request
    payload = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "id": "test-1"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
    }
    
    print("Testing MCP server at", url)
    print("Payload:", json.dumps(payload, indent=2))
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            print("\n❌ Got 400 Bad Request - checking what headers are needed...")
            
            # Try with session ID from previous response
            if 'mcp-session-id' in response.headers:
                session_id = response.headers['mcp-session-id']
                headers['mcp-session-id'] = session_id
                print(f"Retrying with session ID: {session_id}")
                
                response2 = requests.post(url, json=payload, headers=headers, timeout=10)
                print(f"Second attempt status: {response2.status_code}")
                print(f"Second attempt response: {response2.text}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_mcp_server()