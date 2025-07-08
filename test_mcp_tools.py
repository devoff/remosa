#!/usr/bin/env python3
"""Test MCP tools via HTTP interface"""
import requests
import json

MCP_URL = "http://localhost:9091"

def test_rag_search():
    """Test RAG search tool"""
    print("🔍 Testing RAG search tool...")
    
    # Test MCP tool call
    payload = {
        "method": "call_tool",
        "params": {
            "name": "rag_search",
            "arguments": {
                "query": "система мониторинга jobs prometheus",
                "search_type": "hybrid",
                "max_results": 3
            }
        }
    }
    
    try:
        response = requests.post(f"{MCP_URL}/mcp", json=payload, timeout=30)
        result = response.json()
        
        if "result" in result:
            content = result["result"]["content"][0]["data"]
            print(f"✅ Found {len(content.get('results', []))} results")
            if content.get('results'):
                top_result = content['results'][0]
                print(f"   📄 Top result: {top_result['metadata']['section_title']}")
                print(f"   📊 Score: {top_result['similarity_score']:.3f}")
        else:
            print(f"❌ Error: {result}")
            
    except Exception as e:
        print(f"❌ RAG search failed: {e}")

def test_prometheus_health():
    """Test Prometheus health tool"""
    print("\n🏥 Testing Prometheus health tool...")
    
    payload = {
        "method": "call_tool", 
        "params": {
            "name": "prometheus_health",
            "arguments": {}
        }
    }
    
    try:
        response = requests.post(f"{MCP_URL}/mcp", json=payload, timeout=30)
        result = response.json()
        
        if "result" in result:
            content = result["result"]["content"][0]["data"]
            print(f"✅ Prometheus status: {content.get('prometheus_status', 'unknown')}")
            print(f"   🎯 Total targets: {content.get('total_targets', 0)}")
            print(f"   🟢 Up targets: {content.get('up_targets', 0)}")
            
            exporters = content.get('exporters_stats', {})
            for name, stats in exporters.items():
                if 'error' not in stats:
                    print(f"   📊 {name}: {stats}")
        else:
            print(f"❌ Error: {result}")
            
    except Exception as e:
        print(f"❌ Prometheus health failed: {e}")

def test_db_health():
    """Test database health tool"""
    print("\n🗄️ Testing database health tool...")
    
    payload = {
        "method": "call_tool",
        "params": {
            "name": "db_health_check", 
            "arguments": {"detailed": True}
        }
    }
    
    try:
        response = requests.post(f"{MCP_URL}/mcp", json=payload, timeout=30)
        result = response.json()
        
        if "result" in result:
            content = result["result"]["content"][0]["data"]
            print(f"✅ Database status: {content.get('status', 'unknown')}")
            print(f"   📊 Pool size: {content.get('pool_size', 0)}")
            if 'table_stats' in content:
                print(f"   📊 Tables with data: {len(content['table_stats'])}")
        else:
            print(f"❌ Error: {result}")
            
    except Exception as e:
        print(f"❌ Database health failed: {e}")

def test_job_list():
    """Test job listing tool"""
    print("\n📋 Testing job list tool...")
    
    payload = {
        "method": "call_tool",
        "params": {
            "name": "job_list",
            "arguments": {"limit": 5}
        }
    }
    
    try:
        response = requests.post(f"{MCP_URL}/mcp", json=payload, timeout=30)
        result = response.json()
        
        if "result" in result:
            content = result["result"]["content"][0]["data"]
            print(f"✅ Found {content.get('total_jobs', 0)} jobs")
            jobs = content.get('jobs', [])
            for job in jobs[:3]:  # Show first 3 jobs
                print(f"   📄 {job['name']} (ID: {job['id']}) - Active: {job['is_active']}")
        else:
            print(f"❌ Error: {result}")
            
    except Exception as e:
        print(f"❌ Job list failed: {e}")

def main():
    print("🧪 Testing REMOSA MCP Tools")
    print("=" * 50)
    
    # Test connectivity
    try:
        response = requests.get(f"{MCP_URL}/mcp", timeout=5)
        print(f"✅ MCP server accessible (status: {response.status_code})")
    except Exception as e:
        print(f"❌ MCP server not accessible: {e}")
        return
    
    # Run tests
    test_rag_search()
    test_prometheus_health()
    test_db_health()
    test_job_list()
    
    print("\n✅ MCP Tools Test Complete!")

if __name__ == "__main__":
    main()