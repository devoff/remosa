#!/usr/bin/env python3
"""
REMOSA Integrated MCP HTTP Server
Provides all 19 MCP tools via HTTP interface for containerized deployment
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
from pydantic import BaseModel
from mcp_server.server import FastMCP

RAG_URL = os.getenv("RAG_URL", "http://localhost:9090/api/v1/rag/search")
MCP_PORT = int(os.getenv("MCP_PORT", "9091"))
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")

srv = FastMCP(name="REMOSA Integrated Tools", version="1.0.0")

def create_app():
    """Factory function for FastMCP ASGI app"""
    return srv.streamable_http_app()

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def ensure_db_connection():
    """Ensure database connection is established"""
    global db_pool
    if db_pool is None:
        # Container network addressing
        db_host = os.getenv("POSTGRES_HOST", "db")
        db_port = int(os.getenv("POSTGRES_PORT", "5432"))
        db_name = os.getenv("POSTGRES_DB", "remosa")
        db_user = os.getenv("POSTGRES_USER", "postgres")
        db_password = os.getenv("POSTGRES_PASSWORD", "")
        
        try:
            db_pool = await asyncpg.create_pool(
                host=db_host, port=db_port, database=db_name,
                user=db_user, password=db_password,
                min_size=1, max_size=5
            )
            print(f"✅ Database connected: {db_host}:{db_port}/{db_name}")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            # Fallback to host network
            try:
                db_pool = await asyncpg.create_pool(
                    host="host.docker.internal", port=5432, database=db_name,
                    user=db_user, password=db_password,
                    min_size=1, max_size=3
                )
                print("✅ Database connected via host.docker.internal")
            except Exception as e2:
                print(f"❌ Fallback database connection failed: {e2}")

# === RAG TOOLS ===
class RagSearchParams(BaseModel):
    query: str
    search_type: str = "hybrid"
    max_results: int = 10

@srv.tool("rag_search")
async def rag_search(params):
    """Search knowledge base using RAG system"""
    try:
        p = RagSearchParams.parse_obj(params)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(RAG_URL, json=p.dict())
            resp.raise_for_status()
            hits = resp.json()
            return {"content": [{"type": "json", "data": hits}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"RAG search error: {str(e)}"}]}

# === DATABASE TOOLS ===
class DbHealthParams(BaseModel):
    detailed: bool = False

@srv.tool("db_health_check")
async def db_health_check(params):
    """Check PostgreSQL database health and connection status"""
    try:
        p = DbHealthParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            version = await conn.fetchval("SELECT version()")
            current_time = await conn.fetchval("SELECT NOW()")
            
            result = {
                "status": "healthy",
                "timestamp": current_time.isoformat(),
                "postgresql_version": version,
                "pool_size": db_pool.get_size()
            }
            
            if p.detailed:
                stats = await conn.fetch("""
                    SELECT schemaname, tablename, n_live_tup as live_tuples
                    FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10
                """)
                result["table_stats"] = [dict(row) for row in stats]
            
            return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Database error: {str(e)}"}]}

class DbQueryParams(BaseModel):
    query: str
    limit: int = 50

@srv.tool("db_query")
async def db_query(params):
    """Execute safe SELECT queries on database"""
    try:
        p = DbQueryParams.parse_obj(params)
        query = p.query.strip()
        if not query.upper().startswith("SELECT"):
            return {"content": [{"type": "text", "text": "Only SELECT queries are allowed"}]}
        
        if "LIMIT" not in query.upper():
            query = f"{query.rstrip(';')} LIMIT {p.limit}"
        
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            results = await conn.fetch(query)
            formatted = [dict(row) for row in results]
            
            return {"content": [{"type": "json", "data": {
                "query": query,
                "count": len(formatted),
                "results": formatted
            }}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Query error: {str(e)}"}]}

class DbMigrationParams(BaseModel):
    action: str

@srv.tool("db_migration")
async def db_migration(params):
    """Manage database migrations using Alembic"""
    try:
        p = DbMigrationParams.parse_obj(params)
        action = p.action
        
        if action == "status":
            cmd = ["alembic", "current", "-v"]
        elif action == "upgrade":
            cmd = ["alembic", "upgrade", "head"]
        elif action == "current":
            cmd = ["alembic", "current"]
        else:
            return {"content": [{"type": "text", "text": f"Unknown migration action: {action}"}]}
        
        # Execute from backend directory
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        result = {
            "action": action,
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Migration error: {str(e)}"}]}

# === PROMETHEUS TOOLS ===
class PrometheusQueryParams(BaseModel):
    query: str
    timeout: int = 10

@srv.tool("prometheus_query")
async def prometheus_query(params):
    """Execute PromQL queries against Prometheus"""
    try:
        p = PrometheusQueryParams.parse_obj(params)
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        response = requests.get(
            f"{api_url}query",
            params={"query": p.query},
            timeout=p.timeout
        )
        response.raise_for_status()
        
        data = response.json()
        if data["status"] == "success":
            result = {
                "query": p.query,
                "status": "success",
                "result_count": len(data["data"]["result"]),
                "results": data["data"]["result"],
                "timestamp": datetime.now().isoformat()
            }
        else:
            result = {
                "query": p.query,
                "status": "error",
                "error": data.get("error", "Unknown error"),
                "timestamp": datetime.now().isoformat()
            }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus query error: {str(e)}"}]}

class PrometheusDevicesParams(BaseModel):
    platform_id: Optional[int] = None
    exporter_type: str = "all"

@srv.tool("prometheus_devices")
async def prometheus_devices(params):
    """Get list of devices from Prometheus by platform and exporter type"""
    try:
        p = PrometheusDevicesParams.parse_obj(params)
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        devices = []
        
        # CubicExporter devices
        if p.exporter_type in ["cubic", "all"]:
            if p.platform_id:
                query = f'remosa_exporter_cubic_device_status{{platform_id="{p.platform_id}"}}'
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
        
        # AddRealityExporter devices
        if p.exporter_type in ["addreality", "all"]:
            if p.platform_id:
                query = f'addreality_device_connection_state{{platform_id="{p.platform_id}"}}'
            else:
                query = 'addreality_device_connection_state'
            
            response = requests.get(f"{api_url}query", params={"query": query}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data["status"] == "success":
                    for result in data["data"]["result"]:
                        metric = result["metric"]
                        devices.append({
                            "mac": metric.get("device_mac", "unknown"),
                            "platform_id": metric.get("platform_id", "unknown"),
                            "device_name": metric.get("device_name", "unknown"),
                            "exporter_type": "addreality",
                            "connection_state": int(float(result["value"][1])),
                            "status_text": "connected" if int(float(result["value"][1])) == 1 else "disconnected"
                        })
        
        result = {
            "platform_id": p.platform_id,
            "exporter_type": p.exporter_type,
            "device_count": len(devices),
            "devices": devices,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus devices error: {str(e)}"}]}

class PrometheusMetricsParams(BaseModel):
    device_mac: str
    metric_type: str = "all"

@srv.tool("prometheus_metrics")
async def prometheus_metrics(params):
    """Get metrics for specific device by MAC address"""
    try:
        p = PrometheusMetricsParams.parse_obj(params)
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        metrics = {}
        queries = []
        
        if p.metric_type in ["status", "all"]:
            queries.append(("cubic_status", f'remosa_exporter_cubic_device_status{{mac="{p.device_mac}"}}'))
            queries.append(("addreality_connection", f'addreality_device_connection_state{{device_mac="{p.device_mac}"}}'))
        
        if p.metric_type in ["info", "all"]:
            queries.append(("cubic_info", f'remosa_exporter_cubic_device_info{{mac="{p.device_mac}"}}'))
            queries.append(("addreality_info", f'addreality_device_info{{device_mac="{p.device_mac}"}}'))
        
        if p.metric_type in ["player", "all"]:
            queries.append(("player_status", f'addreality_device_player_status{{device_mac="{p.device_mac}"}}'))
            queries.append(("last_online", f'addreality_device_last_online{{device_mac="{p.device_mac}"}}'))
        
        for metric_name, query in queries:
            try:
                response = requests.get(f"{api_url}query", params={"query": query}, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data["status"] == "success" and data["data"]["result"]:
                        result = data["data"]["result"][0]
                        metrics[metric_name] = {
                            "value": result["value"][1],
                            "metric": result["metric"],
                            "query": query
                        }
            except Exception as e:
                metrics[metric_name] = {"error": str(e)}
        
        result = {
            "device_mac": p.device_mac,
            "metric_type": p.metric_type,
            "metrics_found": len([m for m in metrics.values() if "error" not in m]),
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus metrics error: {str(e)}"}]}

@srv.tool("prometheus_health")
async def prometheus_health(params):
    """Check Prometheus server health and exporters status"""
    try:
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        response = requests.get(f"{api_url}query", params={"query": "up"}, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        if data["status"] != "success":
            return {"content": [{"type": "text", "text": "Prometheus not responding correctly"}]}
        
        exporters_stats = {}
        
        # CubicExporter
        try:
            cubic_response = requests.get(f"{api_url}query", params={"query": "remosa_exporter_cubic_device_status"}, timeout=5)
            if cubic_response.status_code == 200:
                cubic_data = cubic_response.json()
                if cubic_data["status"] == "success":
                    exporters_stats["cubic_exporter"] = {
                        "total_devices": len(cubic_data["data"]["result"]),
                        "online_devices": len([r for r in cubic_data["data"]["result"] if int(float(r["value"][1])) == 1])
                    }
        except:
            exporters_stats["cubic_exporter"] = {"error": "Not accessible"}
        
        # AddRealityExporter
        try:
            ar_response = requests.get(f"{api_url}query", params={"query": "addreality_device_connection_state"}, timeout=5)
            if ar_response.status_code == 200:
                ar_data = ar_response.json()
                if ar_data["status"] == "success":
                    exporters_stats["addreality_exporter"] = {
                        "total_devices": len(ar_data["data"]["result"]),
                        "connected_devices": len([r for r in ar_data["data"]["result"] if int(float(r["value"][1])) == 1])
                    }
        except:
            exporters_stats["addreality_exporter"] = {"error": "Not accessible"}
        
        result = {
            "prometheus_status": "healthy",
            "prometheus_url": prometheus_url,
            "exporters_stats": exporters_stats,
            "total_targets": len(data["data"]["result"]),
            "up_targets": len([r for r in data["data"]["result"] if int(float(r["value"][1])) == 1]),
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Prometheus health check error: {str(e)}"}]}

# === JOB SYSTEM TOOLS ===
class JobCreateParams(BaseModel):
    name: str
    description: Optional[str] = None
    command: str
    platform_id: int
    device_id: Optional[int] = None
    monitoring_device_mac: Optional[str] = None
    monitoring_metric: Optional[str] = None
    operator: Optional[str] = None
    threshold_value: Optional[str] = None

@srv.tool("job_create")
async def job_create(params):
    """Create new monitoring job with Prometheus integration"""
    try:
        p = JobCreateParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            insert_data = {
                "name": p.name,
                "command": p.command,
                "platform_id": p.platform_id,
                "description": p.description,
                "device_id": p.device_id,
                "monitoring_device_mac": p.monitoring_device_mac,
                "monitoring_metric": p.monitoring_metric,
                "operator": p.operator,
                "threshold_value": p.threshold_value,
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

class JobListParams(BaseModel):
    platform_id: Optional[int] = None
    is_active: Optional[bool] = None
    limit: int = 50

@srv.tool("job_list")
async def job_list(params):
    """List jobs with optional platform and status filtering"""
    try:
        p = JobListParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            where_conditions = []
            query_params = []
            param_counter = 1
            
            if p.platform_id:
                where_conditions.append(f"platform_id = ${param_counter}")
                query_params.append(p.platform_id)
                param_counter += 1
            
            if p.is_active is not None:
                where_conditions.append(f"is_active = ${param_counter}")
                query_params.append(p.is_active)
                param_counter += 1
            
            where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""
            
            query = f"""
                SELECT 
                    id, name, description, command, platform_id, device_id,
                    is_active, monitoring_device_mac, monitoring_metric,
                    operator, threshold_value, last_prometheus_value,
                    last_check_time, created_at, updated_at
                FROM jobs 
                {where_clause}
                ORDER BY created_at DESC 
                LIMIT {p.limit}
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
                "platform_id": p.platform_id,
                "is_active": p.is_active,
                "total_jobs": len(jobs),
                "jobs": jobs,
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job list error: {str(e)}"}]}

class JobStatusParams(BaseModel):
    job_id: int
    include_executions: bool = True

@srv.tool("job_status")
async def job_status(params):
    """Get detailed status of specific job including execution history"""
    try:
        p = JobStatusParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            job_query = """
                SELECT 
                    id, name, description, command, platform_id, device_id,
                    is_active, monitoring_device_mac, monitoring_metric,
                    operator, threshold_value, last_prometheus_value,
                    last_check_time, created_at, updated_at
                FROM jobs 
                WHERE id = $1
            """
            
            job_result = await conn.fetchrow(job_query, p.job_id)
            if not job_result:
                return {"content": [{"type": "text", "text": f"Job with ID {p.job_id} not found"}]}
            
            job = dict(job_result)
            for field in ['created_at', 'updated_at', 'last_check_time']:
                if job[field]:
                    job[field] = job[field].isoformat()
            
            response = {
                "job": job,
                "timestamp": datetime.now().isoformat()
            }
            
            if p.include_executions:
                executions_query = """
                    SELECT 
                        id, status, success, start_time, end_time, 
                        prometheus_value, condition_met, error_message,
                        monitoring_device_mac, monitoring_metric, created_at
                    FROM job_executions 
                    WHERE job_id = $1 
                    ORDER BY created_at DESC 
                    LIMIT 20
                """
                
                execution_results = await conn.fetch(executions_query, p.job_id)
                executions = []
                for row in execution_results:
                    execution = dict(row)
                    for field in ['start_time', 'end_time', 'created_at']:
                        if execution[field]:
                            execution[field] = execution[field].isoformat()
                    executions.append(execution)
                
                response["executions"] = executions
                response["execution_count"] = len(executions)
                
                if executions:
                    successful = len([e for e in executions if e.get("success")])
                    response["execution_stats"] = {
                        "total": len(executions),
                        "successful": successful,
                        "failed": len(executions) - successful,
                        "success_rate": round(successful / len(executions) * 100, 2) if executions else 0
                    }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job status error: {str(e)}"}]}

class JobAnalyticsParams(BaseModel):
    platform_id: Optional[int] = None
    days: int = 7

@srv.tool("job_analytics")
async def job_analytics(params):
    """Get job performance analytics and statistics"""
    try:
        p = JobAnalyticsParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            platform_filter = ""
            query_params = []
            if p.platform_id:
                platform_filter = "AND j.platform_id = $1"
                query_params.append(p.platform_id)
            
            # Job statistics
            jobs_stats_query = f"""
                SELECT 
                    COUNT(*) as total_jobs,
                    COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
                    COUNT(*) FILTER (WHERE monitoring_device_mac IS NOT NULL) as monitoring_jobs
                FROM jobs j
                WHERE 1=1 {platform_filter}
            """
            
            jobs_stats = await conn.fetchrow(jobs_stats_query, *query_params)
            
            # Execution statistics
            executions_stats_query = f"""
                SELECT 
                    COUNT(*) as total_executions,
                    COUNT(*) FILTER (WHERE success = true) as successful_executions,
                    COUNT(*) FILTER (WHERE success = false) as failed_executions,
                    AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
                FROM job_executions je
                JOIN jobs j ON je.job_id = j.id
                WHERE je.created_at >= NOW() - INTERVAL '{p.days} days' {platform_filter}
            """
            
            executions_stats = await conn.fetchrow(executions_stats_query, *query_params)
            
            response = {
                "platform_id": p.platform_id,
                "period_days": p.days,
                "jobs_statistics": dict(jobs_stats),
                "executions_statistics": {
                    "total_executions": executions_stats["total_executions"] or 0,
                    "successful_executions": executions_stats["successful_executions"] or 0,
                    "failed_executions": executions_stats["failed_executions"] or 0,
                    "success_rate": round((executions_stats["successful_executions"] or 0) / max(executions_stats["total_executions"] or 1, 1) * 100, 2),
                    "avg_duration_seconds": round(float(executions_stats["avg_duration_seconds"] or 0), 2)
                },
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job analytics error: {str(e)}"}]}

class JobToggleParams(BaseModel):
    job_id: int
    is_active: bool

@srv.tool("job_toggle")
async def job_toggle(params):
    """Toggle job active status (activate/deactivate)"""
    try:
        p = JobToggleParams.parse_obj(params)
        await ensure_db_connection()
        if not db_pool:
            return {"content": [{"type": "text", "text": "Database connection not available"}]}
            
        async with db_pool.acquire() as conn:
            update_query = """
                UPDATE jobs 
                SET is_active = $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING id, name, is_active, updated_at
            """
            
            result = await conn.fetchrow(update_query, p.is_active, p.job_id)
            if not result:
                return {"content": [{"type": "text", "text": f"Job with ID {p.job_id} not found"}]}
            
            response = {
                "job_id": result["id"],
                "job_name": result["name"],
                "is_active": result["is_active"],
                "updated_at": result["updated_at"].isoformat(),
                "action": "activated" if p.is_active else "deactivated",
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content": [{"type": "json", "data": response}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Job toggle error: {str(e)}"}]}

# === DOCKER TOOLS ===
class DockerStatusParams(BaseModel):
    service: Optional[str] = None

@srv.tool("docker_status")
async def docker_status(params):
    """Get Docker container status for REMOSA services"""
    try:
        p = DockerStatusParams.parse_obj(params)
        if p.service:
            cmd = ["docker-compose", "ps", p.service]
        else:
            cmd = ["docker-compose", "ps"]
        
        # Execute from project root - note: this works only on host system
        # In container, docker-compose commands won't work
        project_root = os.getenv("PROJECT_ROOT", "/opt/remosa")
        process = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=30)
        
        result = {
            "service": p.service or "all",
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Docker error: {str(e)}"}]}

class DockerRestartParams(BaseModel):
    service: str

@srv.tool("docker_restart")
async def docker_restart(params):
    """Restart specific Docker service"""
    try:
        p = DockerRestartParams.parse_obj(params)
        cmd = ["docker-compose", "restart", p.service]
        
        project_root = os.getenv("PROJECT_ROOT", "/opt/remosa")
        process = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=60)
        
        result = {
            "service": p.service,
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Restart error: {str(e)}"}]}

class DockerLogsParams(BaseModel):
    service: str
    lines: int = 50

@srv.tool("docker_logs")
async def docker_logs(params):
    """Get Docker container logs for specific service"""
    try:
        p = DockerLogsParams.parse_obj(params)
        cmd = ["docker-compose", "logs", "--tail", str(p.lines), p.service]
        
        project_root = os.getenv("PROJECT_ROOT", "/opt/remosa")
        process = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=30)
        
        result = {
            "service": p.service,
            "lines": p.lines,
            "success": process.returncode == 0,
            "logs": process.stdout,
            "error": process.stderr
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Logs error: {str(e)}"}]}

@srv.tool("docker_health")
async def docker_health(params):
    """Get overall Docker system health for REMOSA"""
    try:
        cmd = ["docker-compose", "ps", "--format", "json"]
        project_root = os.getenv("PROJECT_ROOT", "/opt/remosa")
        process = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True, timeout=30)
        
        if process.returncode != 0:
            return {"content": [{"type": "text", "text": f"Docker health check failed: {process.stderr}"}]}
        
        containers = []
        for line in process.stdout.strip().split('\n'):
            if line.strip():
                try:
                    container = json.loads(line)
                    containers.append(container)
                except json.JSONDecodeError:
                    continue
        
        result = {
            "timestamp": datetime.now().isoformat(),
            "containers": containers,
            "total_containers": len(containers),
            "healthy_containers": len([c for c in containers if c.get("State") == "running"])
        }
        
        return {"content": [{"type": "json", "data": result}]}
    except Exception as e:
        return {"content": [{"type": "text", "text": f"Health check error: {str(e)}"}]}

async def initialize():
    """Initialize connections on server startup"""
    print("🚀 Starting REMOSA Integrated MCP HTTP Server...")
    print(f"📡 Server will run on port {MCP_PORT}")
    await ensure_db_connection()
    print("✅ MCP Server ready with 19 tools!")

if __name__ == "__main__":
    print("🔧 Starting REMOSA MCP HTTP Server...")
    import asyncio
    import uvicorn
    import os
    
    asyncio.run(initialize())
    
    # Create ASGI app from FastMCP for HTTP transport
    print(f"🚀 Starting HTTP MCP Server on {MCP_HOST}:{MCP_PORT}")
    
    # Set environment variables for FastMCP
    os.environ["UVICORN_HOST"] = MCP_HOST
    os.environ["UVICORN_PORT"] = str(MCP_PORT)
    
    # Use uvicorn directly for streamable-http
    uvicorn.run(
        "mcp_server_http:create_app", 
        host=MCP_HOST, 
        port=MCP_PORT,
        factory=True
    )