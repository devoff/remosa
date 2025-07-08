#!/usr/bin/env python3
"""Test MCP tools directly in container"""
import asyncio
import os
import sys

# Add path for imports
sys.path.append('/opt/remosa/rag_service')

async def test_mcp_tools():
    """Test MCP tools directly"""
    print("🧪 Testing MCP Tools Directly")
    print("=" * 50)
    
    # Import MCP server components
    from mcp_server_http import (
        docker_status, docker_health, docker_logs, docker_restart,
        prometheus_query, prometheus_health, prometheus_devices,
        db_health_check, job_list
    )
    
    # Test 1: Docker Status
    print("\n🐳 Testing Docker Status...")
    try:
        result = await docker_status({"service": ""})
        print(f"✅ Docker status: {result['content'][0].get('type', 'unknown')}")
        if result['content'][0]['type'] == 'json':
            data = result['content'][0]['data']
            print(f"   Success: {data.get('success', False)}")
            if not data.get('success', False):
                print(f"   Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Docker status failed: {e}")
    
    # Test 2: Docker Health  
    print("\n🏥 Testing Docker Health...")
    try:
        result = await docker_health({})
        print(f"✅ Docker health: {result['content'][0].get('type', 'unknown')}")
        if result['content'][0]['type'] == 'json':
            data = result['content'][0]['data']
            print(f"   Total containers: {data.get('total_containers', 0)}")
            print(f"   Healthy containers: {data.get('healthy_containers', 0)}")
    except Exception as e:
        print(f"❌ Docker health failed: {e}")
    
    # Test 3: Prometheus Health
    print("\n📊 Testing Prometheus Health...")
    try:
        result = await prometheus_health({})
        print(f"✅ Prometheus health: {result['content'][0].get('type', 'unknown')}")
        if result['content'][0]['type'] == 'text':
            print(f"   Error: {result['content'][0]['text']}")
        elif result['content'][0]['type'] == 'json':
            data = result['content'][0]['data']
            print(f"   Status: {data.get('prometheus_status', 'unknown')}")
    except Exception as e:
        print(f"❌ Prometheus health failed: {e}")
    
    # Test 4: Database Health
    print("\n🗄️ Testing Database Health...")
    try:
        result = await db_health_check({"detailed": False})
        print(f"✅ Database health: {result['content'][0].get('type', 'unknown')}")
        if result['content'][0]['type'] == 'json':
            data = result['content'][0]['data']
            print(f"   Status: {data.get('status', 'unknown')}")
        elif result['content'][0]['type'] == 'text':
            print(f"   Error: {result['content'][0]['text']}")
    except Exception as e:
        print(f"❌ Database health failed: {e}")
    
    # Test 5: Job List
    print("\n📋 Testing Job List...")
    try:
        result = await job_list({"limit": 3})
        print(f"✅ Job list: {result['content'][0].get('type', 'unknown')}")
        if result['content'][0]['type'] == 'json':
            data = result['content'][0]['data']
            print(f"   Total jobs: {data.get('total_jobs', 0)}")
        elif result['content'][0]['type'] == 'text':
            print(f"   Error: {result['content'][0]['text']}")
    except Exception as e:
        print(f"❌ Job list failed: {e}")

    print("\n✅ MCP Tools Direct Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_mcp_tools())