#!/usr/bin/env python3
"""
Simple MCP HTTP Server for REMOSA
Compatible with Claude Code MCP client - returns plain JSON
"""

import os
import asyncio
import httpx
import json
import subprocess
import asyncpg
import requests
from datetime import datetime
from typing import Optional, Dict, Any, List
from urllib.parse import urljoin
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging
from fastapi.responses import PlainTextResponse
from fastapi import status

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
RAG_URL = os.getenv("RAG_URL", "http://localhost:9090/api/v1/rag/search")
MCP_PORT = int(os.getenv("MCP_PORT", "9091"))
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")

app = FastAPI(title="REMOSA Simple MCP Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def get_db_connection():
    """Get database connection"""
    db_host = os.getenv("POSTGRES_HOST", "192.168.1.178")
    db_port = int(os.getenv("POSTGRES_PORT", "5432"))
    db_name = os.getenv("POSTGRES_DB", "remosa")
    db_user = os.getenv("POSTGRES_USER", "remosa")
    db_password = os.getenv("POSTGRES_PASSWORD", "1234567890")
    
    return await asyncpg.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )

async def ensure_db_connection():
    """Ensure database connection is established"""
    global db_pool
    if db_pool is None:
        db_host = os.getenv("POSTGRES_HOST", "192.168.1.178")
        db_port = int(os.getenv("POSTGRES_PORT", "5432"))
        db_name = os.getenv("POSTGRES_DB", "remosa")
        db_user = os.getenv("POSTGRES_USER", "remosa")
        db_password = os.getenv("POSTGRES_PASSWORD", "1234567890")
        
        try:
            db_pool = await asyncpg.create_pool(
                host=db_host, port=db_port, database=db_name,
                user=db_user, password=db_password,
                min_size=1, max_size=5
            )
            logger.info(f"✅ Database connected: {db_host}:{db_port}/{db_name}")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")

# MCP Request/Response models
from pydantic import validator
class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: str
    params: Optional[Dict[str, Any]] = None
    
    @validator('id', pre=True)
    def convert_id_to_string(cls, v):
        return str(v)

class MCPResponse(BaseModel):
    jsonrpc: str = "2.0"
    id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

# Tool definitions
TOOLS = [
    {
        "name": "rag_search",
        "description": "Search knowledge base using RAG system",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "search_type": {"type": "string", "enum": ["hybrid", "keyword"], "default": "hybrid"},
                "max_results": {"type": "integer", "default": 10}
            },
            "required": ["query"]
        }
    },
    {
        "name": "db_health_check",
        "description": "Check PostgreSQL database health",
        "inputSchema": {
            "type": "object",
            "properties": {
                "detailed": {"type": "boolean", "default": False}
            }
        }
    },
    {
        "name": "db_query",
        "description": "Execute safe SELECT queries on database",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "SQL SELECT query"},
                "limit": {"type": "integer", "default": 50}
            },
            "required": ["query"]
        }
    },
    {
        "name": "prometheus_query",
        "description": "Execute PromQL queries against Prometheus",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "PromQL query"},
                "timeout": {"type": "integer", "default": 10}
            },
            "required": ["query"]
        }
    },
    {
        "name": "prometheus_devices",
        "description": "Get list of devices from Prometheus by platform and exporter type",
        "inputSchema": {
            "type": "object",
            "properties": {
                "platform_id": {"type": "integer", "description": "Platform ID (optional)"},
                "exporter_type": {"type": "string", "enum": ["cubic", "addreality", "all"], "default": "all"}
            }
        }
    },
    {
        "name": "job_create",
        "description": "Create new monitoring job with Prometheus integration",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "command": {"type": "string"},
                "platform_id": {"type": "integer"},
                "description": {"type": "string"},
                "device_id": {"type": "integer"},
                "monitoring_device_mac": {"type": "string"},
                "monitoring_metric": {"type": "string"},
                "operator": {"type": "string", "enum": [">", "<", "=", "!=", ">=", "<="]},
                "threshold_value": {"type": "string"}
            },
            "required": ["name", "command", "platform_id"]
        }
    },
    {
        "name": "job_list",
        "description": "List jobs with optional platform and status filtering",
        "inputSchema": {
            "type": "object",
            "properties": {
                "platform_id": {"type": "integer"},
                "is_active": {"type": "boolean"},
                "limit": {"type": "integer", "default": 50}
            }
        }
    },
    {
        "name": "docker_status",
        "description": "Get Docker container status for REMOSA services",
        "inputSchema": {
            "type": "object",
            "properties": {
                "service": {"type": "string", "description": "Service name (optional)"}
            }
        }
    }
]

# Tool implementations
async def tool_rag_search(params: Dict[str, Any]) -> Dict[str, Any]:
    """Search knowledge base using RAG system"""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(RAG_URL, json=params)
            resp.raise_for_status()
            hits = resp.json()
            return {"content": [{"type": "json", "data": hits}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"RAG search error: {str(e)}"}]}

async def tool_db_health_check(params: Dict[str, Any]) -> Dict[str, Any]:
    """Check PostgreSQL database health"""
    try:
        conn = await get_db_connection()
        try:
            version = await conn.fetchval("SELECT version()")
            current_time = await conn.fetchval("SELECT NOW()")
            
            result = {
                "status": "healthy",
                "timestamp": current_time.isoformat(),
                "postgresql_version": version,
            }
            
            if params.get("detailed", False):
                stats = await conn.fetch("""
                    SELECT schemaname, tablename, n_live_tup as live_tuples
                    FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10
                """)
                result["table_stats"] = [dict(row) for row in stats]
            
            return {"content": [{"type": "json", "data": result}]}
        finally:
            await conn.close()
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Database error: {str(e)}"}]}

async def tool_db_query(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute safe SELECT queries on database"""
    try:
        query = params["query"].strip()
        if not query.upper().startswith("SELECT"):
            return {"content": [{"type": "text", "text": "Only SELECT queries are allowed"}]}
        
        limit = params.get("limit", 50)
        if "LIMIT" not in query.upper():
            query = f"{query.rstrip(';')} LIMIT {limit}"
        
        conn = await get_db_connection()
        try:
            results = await conn.fetch(query)
            formatted = [dict(row) for row in results]
            
            return {"content": [{"type": "json", "data": {
                "query": query,
                "count": len(formatted),
                "results": formatted
            }}]}
        finally:
            await conn.close()
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Query error: {str(e)}"}]}

async def tool_prometheus_query(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute PromQL queries against Prometheus"""
    try:
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.103:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        query = params["query"]
        timeout = params.get("timeout", 10)
        
        response = requests.get(
            f"{api_url}query",
            params={"query": query},
            timeout=timeout
        )
        response.raise_for_status()
        
        data = response.json()
        if data["status"] == "success":
            result = {
                "query": query,
                "status": "success",
                "result_count": len(data["data"]["result"]),
                "results": data["data"]["result"],
                "timestamp": datetime.now().isoformat()
            }
        else:
            result = {
                "query": query,
                "status": "error",
                "error": data.get("error", "Unknown error"),
                "timestamp": datetime.now().isoformat()
            }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus query error: {str(e)}"}]}

async def tool_prometheus_devices(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get list of devices from Prometheus"""
    try:
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.103:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        platform_id = params.get("platform_id")
        exporter_type = params.get("exporter_type", "all")
        
        devices = []
        
        # CubicExporter devices
        if exporter_type in ["cubic", "all"]:
            if platform_id:
                query = f'remosa_exporter_cubic_device_status{{platform_id="{platform_id}"}}'
            else:
                query = 'remosa_exporter_cubic_device_status'
            
            response = requests.get(f"{api_url}query", params={"query": query}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data["status"] == "success":
                    for result in data["data"]["result"]:
                        metric = result["metric"]
                        devices.append({
                            "mac": metric.get("mac", "unknown"),
                            "platform_id": metric.get("platform_id", "unknown"),
                            "exporter_id": metric.get("exporter_id", "unknown"),
                            "exporter_type": "cubic",
                            "status": int(float(result["value"][1])),
                            "status_text": "online" if int(float(result["value"][1])) == 1 else "offline"
                        })
        
        result = {
            "platform_id": platform_id,
            "exporter_type": exporter_type,
            "device_count": len(devices),
            "devices": devices,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus devices error: {str(e)}"}]}

async def tool_job_create(params: Dict[str, Any]) -> Dict[str, Any]:
    """Create new monitoring job"""
    try:
        conn = get_db_connection()
        with conn:
            insert_data = {
                "name": params["name"],
                "command": params["command"],
                "platform_id": params["platform_id"],
                "description": params.get("description"),
                "device_id": params.get("device_id"),
                "monitoring_device_mac": params.get("monitoring_device_mac"),
                "monitoring_metric": params.get("monitoring_metric"),
                "operator": params.get("operator"),
                "threshold_value": params.get("threshold_value"),
                "is_active": True,
                "timeout": 300,
                "retry_count": 3,
                "retry_delay": 60
            }
            
            columns = [k for k, v in insert_data.items() if v is not None]
            values = [insert_data[k] for k in columns]
            placeholders = [f"${i+1}" for i in range(len(values))]
            
            query = f"""
                INSERT INTO jobs ({', '.join(columns)}, created_at) 
                VALUES ({', '.join(placeholders)}, NOW()) 
                RETURNING id, name, created_at
            """
            
            result = await conn.fetchrow(query, *values)
            
            response = {
                "status": "success",
                "job_id": result["id"],
                "job_name": result["name"],
                "created_at": result["created_at"].isoformat(),
                "parameters": {k: v for k, v in insert_data.items() if v is not None},
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job creation error: {str(e)}"}]}

async def tool_job_list(params: Dict[str, Any]) -> Dict[str, Any]:
    """List jobs with filtering"""
    try:
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            where_conditions = []
            query_params = []
            param_counter = 1
            
            if params.get("platform_id"):
                where_conditions.append(f"platform_id = ${param_counter}")
                query_params.append(params["platform_id"])
                param_counter += 1
            
            if params.get("is_active") is not None:
                where_conditions.append(f"is_active = ${param_counter}")
                query_params.append(params["is_active"])
                param_counter += 1
            
            where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            limit = params.get("limit", 50)
            
            query = f"""
                SELECT 
                    id, name, description, command, platform_id, device_id,
                    is_active, monitoring_device_mac, monitoring_metric,
                    operator, threshold_value, last_prometheus_value,
                    last_check_time, created_at, updated_at
                FROM jobs 
                {where_clause}
                ORDER BY created_at DESC 
                LIMIT {limit}
            """
            
            results = await conn.fetch(query, *query_params)
            
            jobs = []
            for row in results:
                job = dict(row)
                for field in ['created_at', 'updated_at', 'last_check_time']:
                    if job[field]:
                        job[field] = job[field].isoformat()
                jobs.append(job)
            
            response = {
                "platform_id": params.get("platform_id"),
                "is_active": params.get("is_active"),
                "total_jobs": len(jobs),
                "jobs": jobs,
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job list error: {str(e)}"}]}

async def tool_docker_status(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get Docker container status"""
    try:
        service = params.get("service")
        if service:
            cmd = ["docker-compose", "ps", service]
        else:
            cmd = ["docker-compose", "ps"]
        
        project_root = os.getenv("PROJECT_ROOT", "/opt/remosa")
        process = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=30)
        
        result = {
            "service": service or "all",
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Docker error: {str(e)}"}]}

# Tool dispatcher
TOOL_FUNCTIONS = {
    "rag_search": tool_rag_search,
    "db_health_check": tool_db_health_check,
    "db_query": tool_db_query,
    "prometheus_query": tool_prometheus_query,
    "prometheus_devices": tool_prometheus_devices,
    "job_create": tool_job_create,
    "job_list": tool_job_list,
    "docker_status": tool_docker_status,
}

@app.post("/mcp")
async def mcp_endpoint(request: Request):
    """Simple MCP endpoint that returns plain JSON"""
    accept = request.headers.get("accept", "")
    try:
        body = await request.json()
        mcp_request = MCPRequest(**body)
        
        if mcp_request.method == "initialize":
            # Если Accept содержит application/json или text/event-stream — всегда возвращаем JSON
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "serverInfo": {
                        "name": "REMOSA RAG MCP",
                        "version": "1.0.0",
                        "description": "REMOSA RAG MCP server for Cursor"
                    },
                    "tools": TOOLS,
                    "offerings": TOOLS
                }
            }
        
        logger.info(f"MCP Request: {mcp_request.method}")
        
        if mcp_request.method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "result": {"tools": TOOLS}
            }
        
        elif mcp_request.method == "tools/call":
            if not mcp_request.params:
                return {
                    "jsonrpc": "2.0",
                    "id": mcp_request.id,
                    "error": {"code": -32602, "message": "Missing parameters"}
                }
            
            tool_name = mcp_request.params.get("name")
            tool_arguments = mcp_request.params.get("arguments", {})
            
            if tool_name not in TOOL_FUNCTIONS:
                return {
                    "jsonrpc": "2.0",
                    "id": mcp_request.id,
                    "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"}
                }
            
            # Execute tool
            tool_result = await TOOL_FUNCTIONS[tool_name](tool_arguments)
            
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "result": tool_result
            }
        
        elif mcp_request.method == "ListOfferings":
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "result": {
                    "offerings": TOOLS,
                    "serverInfo": {
                        "name": "REMOSA RAG MCP",
                        "version": "1.0.0",
                        "description": "REMOSA RAG MCP server for Cursor"
                    },
                    "capabilities": {}
                }
            }
        
        else:
            return {
                "jsonrpc": "2.0",
                "id": mcp_request.id,
                "error": {"code": -32601, "message": f"Unknown method: {mcp_request.method}"}
            }
            
    except Exception as e:
        logger.error(f"MCP Error: {e}")
        return {
            "jsonrpc": "2.0",
            "id": body.get("id", "unknown") if 'body' in locals() else "unknown",
            "error": {"code": -32603, "message": str(e)}
        }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/mcp")
@app.get("/mcp/")
async def mcp_get_tools():
    """Return available tools list for GET requests (compatibility)"""
    return {"jsonrpc": "2.0", "result": {"tools": TOOLS}}

@app.get("/mcp/sse")
@app.get("/mcp/events")
async def mcp_sse_not_supported():
    return PlainTextResponse("SSE not supported", status_code=status.HTTP_405_METHOD_NOT_ALLOWED)

@app.on_event("startup")
async def startup_event():
    """Initialize connections on server startup"""
    logger.info("🚀 Starting REMOSA Simple MCP HTTP Server...")
    logger.info(f"📡 Server will run on port {MCP_PORT}")
    await ensure_db_connection()
    logger.info(f"✅ Simple MCP Server ready with {len(TOOLS)} tools!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed")

async def initialize():
    """Initialize connections on server startup"""
    logger.info("🚀 Starting REMOSA Simple MCP HTTP Server...")
    logger.info(f"📡 Server will run on port {MCP_PORT}")
    await ensure_db_connection()
    logger.info(f"✅ Simple MCP Server ready with {len(TOOLS)} tools!")

if __name__ == "__main__":
    asyncio.run(initialize())
    
    logger.info(f"🚀 Starting Simple MCP HTTP Server on {MCP_HOST}:{MCP_PORT}")
    uvicorn.run(app, host=MCP_HOST, port=MCP_PORT)