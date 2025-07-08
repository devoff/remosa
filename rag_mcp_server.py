from mcp import StdioServerTransport
from mcp.server import Server
import httpx, os, asyncio, json, subprocess, asyncpg
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RAG_URL = os.getenv("RAG_URL", "http://localhost:8002/api/v1/rag/search")
client = httpx.AsyncClient(timeout=30)
srv = Server("REMOSA Integrated Tools")

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def ensure_db_connection():
    """Ensure database connection is established"""
    global db_pool
    if db_pool is None:
        db_host = os.getenv("POSTGRES_HOST", "localhost")
        db_port = int(os.getenv("POSTGRES_PORT", "5432"))
        db_name = os.getenv("POSTGRES_DB", "remosa")
        db_user = os.getenv("POSTGRES_USER", "postgres")
        db_password = os.getenv("POSTGRES_PASSWORD", "")
        
        db_pool = await asyncpg.create_pool(
            host=db_host, port=db_port, database=db_name,
            user=db_user, password=db_password,
            min_size=1, max_size=5
        )
        logger.info("Database connection pool created")

# === RAG TOOLS ===
@srv.tool(
    "rag_search",
    {
        "query": {"type": "string", "description": "Строка запроса"},
        "search_type": {"type": "string", "enum": ["hybrid","keyword"], "default": "hybrid"},
        "max_results": {"type": "integer", "default": 10}
    },
)
async def rag_search(params):
    resp = await client.post(RAG_URL, json=params)
    resp.raise_for_status()
    hits = resp.json()
    return {"content":[{"type":"json","data":hits}]}

# === DATABASE TOOLS ===
@srv.tool(
    "db_health_check",
    {
        "detailed": {"type": "boolean", "default": False, "description": "Детальная статистика БД"}
    },
)
async def db_health_check(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            version = await conn.fetchval("SELECT version()")
            current_time = await conn.fetchval("SELECT NOW()")
            
            result = {
                "status": "healthy",
                "timestamp": current_time.isoformat(),
                "postgresql_version": version,
                "pool_size": db_pool.get_size()
            }
            
            if params.get("detailed", False):
                stats = await conn.fetch("""
                    SELECT schemaname, tablename, n_live_tup as live_tuples
                    FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 10
                """)
                result["table_stats"] = [dict(row) for row in stats]
            
            return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Database error: {str(e)}"}]}

@srv.tool(
    "db_query",
    {
        "query": {"type": "string", "description": "SQL SELECT запрос"},
        "limit": {"type": "integer", "default": 50, "description": "Лимит записей"}
    },
)
async def db_query(params):
    try:
        query = params["query"].strip()
        if not query.upper().startswith("SELECT"):
            return {"content":[{"type":"text","text":"Только SELECT запросы разрешены"}]}
        
        if "LIMIT" not in query.upper():
            query = f"{query.rstrip(';')} LIMIT {params.get('limit', 50)}"
        
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            results = await conn.fetch(query)
            formatted = [dict(row) for row in results]
            
            return {"content":[{"type":"json","data":{
                "query": query,
                "count": len(formatted),
                "results": formatted
            }}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Query error: {str(e)}"}]}

@srv.tool(
    "db_migration",
    {
        "action": {"type": "string", "enum": ["status", "upgrade", "current"], "description": "Действие с миграциями"}
    },
)
async def db_migration(params):
    try:
        action = params["action"]
        backend_dir = "/app" if os.path.exists("/app/alembic.ini") else "/opt/remosa/backend"
        
        if action == "status":
            cmd = ["alembic", "current", "-v"]
        elif action == "upgrade":
            cmd = ["alembic", "upgrade", "head"]
        elif action == "current":
            cmd = ["alembic", "current"]
        
        process = subprocess.run(cmd, cwd=backend_dir, capture_output=True, text=True, timeout=120)
        
        result = {
            "action": action,
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Migration error: {str(e)}"}]}

# === PROMETHEUS TOOLS ===
@srv.tool(
    "prometheus_query",
    {
        "query": {"type": "string", "description": "PromQL запрос"},
        "timeout": {"type": "integer", "default": 10, "description": "Таймаут запроса в секундах"}
    },
)
async def prometheus_query(params):
    try:
        import requests
        from urllib.parse import urljoin
        
        # Используем настройки из конфигурации
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
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
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Prometheus query error: {str(e)}"}]}

@srv.tool(
    "prometheus_devices",
    {
        "platform_id": {"type": "integer", "description": "ID платформы (опционально)"},
        "exporter_type": {"type": "string", "enum": ["cubic", "addreality", "all"], "default": "all", "description": "Тип экспортера"}
    },
)
async def prometheus_devices(params):
    try:
        import requests
        from urllib.parse import urljoin
        
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        platform_id = params.get("platform_id")
        exporter_type = params.get("exporter_type", "all")
        
        devices = []
        
        # Запросы в зависимости от типа экспортера
        if exporter_type in ["cubic", "all"]:
            # CubicExporter устройства
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
        
        if exporter_type in ["addreality", "all"]:
            # AddRealityExporter устройства
            if platform_id:
                query = f'addreality_device_connection_state{{platform_id="{platform_id}"}}'
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
            "platform_id": platform_id,
            "exporter_type": exporter_type,
            "device_count": len(devices),
            "devices": devices,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Prometheus devices error: {str(e)}"}]}

@srv.tool(
    "prometheus_metrics",
    {
        "device_mac": {"type": "string", "description": "MAC адрес устройства"},
        "metric_type": {"type": "string", "enum": ["status", "info", "player", "all"], "default": "all", "description": "Тип метрик"}
    },
)
async def prometheus_metrics(params):
    try:
        import requests
        from urllib.parse import urljoin
        
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        device_mac = params["device_mac"]
        metric_type = params.get("metric_type", "all")
        
        metrics = {}
        
        # Метрики для разных типов
        queries = []
        
        if metric_type in ["status", "all"]:
            # Статус подключения (Cubic)
            queries.append(("cubic_status", f'remosa_exporter_cubic_device_status{{mac="{device_mac}"}}'))
            # Статус подключения (AddReality) 
            queries.append(("addreality_connection", f'addreality_device_connection_state{{device_mac="{device_mac}"}}'))
        
        if metric_type in ["info", "all"]:
            # Информация об устройстве (Cubic)
            queries.append(("cubic_info", f'remosa_exporter_cubic_device_info{{mac="{device_mac}"}}'))
            # Информация об устройстве (AddReality)
            queries.append(("addreality_info", f'addreality_device_info{{device_mac="{device_mac}"}}'))
        
        if metric_type in ["player", "all"]:
            # Статус плеера (AddReality)
            queries.append(("player_status", f'addreality_device_player_status{{device_mac="{device_mac}"}}'))
            # Последнее подключение (AddReality)
            queries.append(("last_online", f'addreality_device_last_online{{device_mac="{device_mac}"}}'))
        
        # Выполняем запросы
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
            "device_mac": device_mac,
            "metric_type": metric_type,
            "metrics_found": len([m for m in metrics.values() if "error" not in m]),
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Prometheus metrics error: {str(e)}"}]}

@srv.tool(
    "prometheus_health",
    {},
)
async def prometheus_health(params):
    try:
        import requests
        from urllib.parse import urljoin
        
        prometheus_url = os.getenv("PROMETHEUS_URL", "http://192.168.1.122:9090")
        api_url = urljoin(prometheus_url, "/api/v1/")
        
        # Проверка доступности Prometheus
        response = requests.get(f"{api_url}query", params={"query": "up"}, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        if data["status"] != "success":
            return {"content":[{"type":"text","text":"Prometheus не отвечает корректно"}]}
        
        # Статистика экспортеров
        exporters_stats = {}
        
        # CubicExporter
        cubic_response = requests.get(f"{api_url}query", params={"query": "remosa_exporter_cubic_device_status"}, timeout=5)
        if cubic_response.status_code == 200:
            cubic_data = cubic_response.json()
            if cubic_data["status"] == "success":
                exporters_stats["cubic_exporter"] = {
                    "total_devices": len(cubic_data["data"]["result"]),
                    "online_devices": len([r for r in cubic_data["data"]["result"] if int(float(r["value"][1])) == 1])
                }
        
        # AddRealityExporter
        ar_response = requests.get(f"{api_url}query", params={"query": "addreality_device_connection_state"}, timeout=5)
        if ar_response.status_code == 200:
            ar_data = ar_response.json()
            if ar_data["status"] == "success":
                exporters_stats["addreality_exporter"] = {
                    "total_devices": len(ar_data["data"]["result"]),
                    "connected_devices": len([r for r in ar_data["data"]["result"] if int(float(r["value"][1])) == 1])
                }
        
        result = {
            "prometheus_status": "healthy",
            "prometheus_url": prometheus_url,
            "exporters_stats": exporters_stats,
            "total_targets": len(data["data"]["result"]),
            "up_targets": len([r for r in data["data"]["result"] if int(float(r["value"][1])) == 1]),
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Prometheus health check error: {str(e)}"}]}

# === JOB SYSTEM TOOLS ===
@srv.tool(
    "job_create",
    {
        "name": {"type": "string", "description": "Имя задания"},
        "description": {"type": "string", "description": "Описание задания (опционально)"},
        "command": {"type": "string", "description": "SMS команда для выполнения"},
        "platform_id": {"type": "integer", "description": "ID платформы"},
        "device_id": {"type": "integer", "description": "ID устройства для управления (опционально)"},
        "monitoring_device_mac": {"type": "string", "description": "MAC устройства для мониторинга (опционально)"},
        "monitoring_metric": {"type": "string", "description": "Prometheus метрика (опционально)"},
        "operator": {"type": "string", "enum": [">", "<", "=", "!=", ">=", "<="], "description": "Оператор сравнения (опционально)"},
        "threshold_value": {"type": "string", "description": "Пороговое значение (опционально)"}
    },
)
async def job_create(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            # Подготовка данных для вставки
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
            
            # Создаем SQL запрос
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
                "parameters": insert_data,
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content":[{"type":"json","data":response}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Job creation error: {str(e)}"}]}

@srv.tool(
    "job_list",
    {
        "platform_id": {"type": "integer", "description": "ID платформы (опционально)"},
        "is_active": {"type": "boolean", "description": "Только активные задания (опционально)"},
        "limit": {"type": "integer", "default": 50, "description": "Лимит записей"}
    },
)
async def job_list(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            # Базовый запрос
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
                # Преобразуем datetime в ISO format
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
            
            return {"content":[{"type":"json","data":response}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Job list error: {str(e)}"}]}

@srv.tool(
    "job_status",
    {
        "job_id": {"type": "integer", "description": "ID задания"},
        "include_executions": {"type": "boolean", "default": True, "description": "Включить историю выполнений"}
    },
)
async def job_status(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            job_id = params["job_id"]
            
            # Получаем информацию о задании
            job_query = """
                SELECT 
                    id, name, description, command, platform_id, device_id,
                    is_active, monitoring_device_mac, monitoring_metric,
                    operator, threshold_value, last_prometheus_value,
                    last_check_time, created_at, updated_at
                FROM jobs 
                WHERE id = $1
            """
            
            job_result = await conn.fetchrow(job_query, job_id)
            if not job_result:
                return {"content":[{"type":"text","text":f"Job with ID {job_id} not found"}]}
            
            job = dict(job_result)
            # Преобразуем datetime в ISO format
            for field in ['created_at', 'updated_at', 'last_check_time']:
                if job[field]:
                    job[field] = job[field].isoformat()
            
            response = {
                "job": job,
                "timestamp": datetime.now().isoformat()
            }
            
            # Включаем историю выполнений если запрошено
            if params.get("include_executions", True):
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
                
                execution_results = await conn.fetch(executions_query, job_id)
                executions = []
                for row in execution_results:
                    execution = dict(row)
                    # Преобразуем datetime в ISO format
                    for field in ['start_time', 'end_time', 'created_at']:
                        if execution[field]:
                            execution[field] = execution[field].isoformat()
                    executions.append(execution)
                
                response["executions"] = executions
                response["execution_count"] = len(executions)
                
                # Статистика выполнений
                if executions:
                    successful = len([e for e in executions if e.get("success")])
                    response["execution_stats"] = {
                        "total": len(executions),
                        "successful": successful,
                        "failed": len(executions) - successful,
                        "success_rate": round(successful / len(executions) * 100, 2) if executions else 0
                    }
            
            return {"content":[{"type":"json","data":response}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Job status error: {str(e)}"}]}

@srv.tool(
    "job_analytics",
    {
        "platform_id": {"type": "integer", "description": "ID платформы (опционально)"},
        "days": {"type": "integer", "default": 7, "description": "Период анализа в днях"}
    },
)
async def job_analytics(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            platform_id = params.get("platform_id")
            days = params.get("days", 7)
            
            # Условие для фильтрации по платформе
            platform_filter = ""
            query_params = [days]
            if platform_id:
                platform_filter = "AND j.platform_id = $2"
                query_params.append(platform_id)
            
            # Общая статистика заданий
            jobs_stats_query = f"""
                SELECT 
                    COUNT(*) as total_jobs,
                    COUNT(*) FILTER (WHERE is_active = true) as active_jobs,
                    COUNT(*) FILTER (WHERE monitoring_device_mac IS NOT NULL) as monitoring_jobs
                FROM jobs j
                WHERE 1=1 {platform_filter.replace('$2', f'${len(query_params)}')}
            """
            
            jobs_stats = await conn.fetchrow(jobs_stats_query, *query_params[1:] if platform_id else [])
            
            # Статистика выполнений за период
            executions_stats_query = f"""
                SELECT 
                    COUNT(*) as total_executions,
                    COUNT(*) FILTER (WHERE success = true) as successful_executions,
                    COUNT(*) FILTER (WHERE success = false) as failed_executions,
                    AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds
                FROM job_executions je
                JOIN jobs j ON je.job_id = j.id
                WHERE je.created_at >= NOW() - INTERVAL '{days} days' {platform_filter}
            """
            
            executions_stats = await conn.fetchrow(executions_stats_query, *query_params[1:] if platform_id else [])
            
            # Топ заданий по количеству выполнений
            top_jobs_query = f"""
                SELECT 
                    j.id, j.name, 
                    COUNT(je.id) as execution_count,
                    COUNT(*) FILTER (WHERE je.success = true) as successful_count,
                    COUNT(*) FILTER (WHERE je.success = false) as failed_count
                FROM jobs j
                LEFT JOIN job_executions je ON j.id = je.job_id 
                    AND je.created_at >= NOW() - INTERVAL '{days} days'
                WHERE 1=1 {platform_filter}
                GROUP BY j.id, j.name
                ORDER BY execution_count DESC
                LIMIT 10
            """
            
            top_jobs = await conn.fetch(top_jobs_query, *query_params[1:] if platform_id else [])
            
            # Статистика по дням
            daily_stats_query = f"""
                SELECT 
                    DATE(je.created_at) as execution_date,
                    COUNT(*) as total_executions,
                    COUNT(*) FILTER (WHERE je.success = true) as successful_executions
                FROM job_executions je
                JOIN jobs j ON je.job_id = j.id
                WHERE je.created_at >= NOW() - INTERVAL '{days} days' {platform_filter}
                GROUP BY DATE(je.created_at)
                ORDER BY execution_date DESC
            """
            
            daily_stats = await conn.fetch(daily_stats_query, *query_params[1:] if platform_id else [])
            
            # Формирование ответа
            response = {
                "platform_id": platform_id,
                "period_days": days,
                "jobs_statistics": dict(jobs_stats),
                "executions_statistics": {
                    "total_executions": executions_stats["total_executions"] or 0,
                    "successful_executions": executions_stats["successful_executions"] or 0,
                    "failed_executions": executions_stats["failed_executions"] or 0,
                    "success_rate": round((executions_stats["successful_executions"] or 0) / max(executions_stats["total_executions"] or 1, 1) * 100, 2),
                    "avg_duration_seconds": round(float(executions_stats["avg_duration_seconds"] or 0), 2)
                },
                "top_jobs": [dict(job) for job in top_jobs],
                "daily_statistics": [{"date": str(day["execution_date"]), "total": day["total_executions"], "successful": day["successful_executions"]} for day in daily_stats],
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content":[{"type":"json","data":response}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Job analytics error: {str(e)}"}]}

@srv.tool(
    "job_toggle",
    {
        "job_id": {"type": "integer", "description": "ID задания"},
        "is_active": {"type": "boolean", "description": "Новый статус активности"}
    },
)
async def job_toggle(params):
    try:
        await ensure_db_connection()
        async with db_pool.acquire() as conn:
            job_id = params["job_id"]
            is_active = params["is_active"]
            
            # Обновляем статус задания
            update_query = """
                UPDATE jobs 
                SET is_active = $1, updated_at = NOW() 
                WHERE id = $2 
                RETURNING id, name, is_active, updated_at
            """
            
            result = await conn.fetchrow(update_query, is_active, job_id)
            if not result:
                return {"content":[{"type":"text","text":f"Job with ID {job_id} not found"}]}
            
            response = {
                "job_id": result["id"],
                "job_name": result["name"],
                "is_active": result["is_active"],
                "updated_at": result["updated_at"].isoformat(),
                "action": "activated" if is_active else "deactivated",
                "timestamp": datetime.now().isoformat()
            }
            
            return {"content":[{"type":"json","data":response}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Job toggle error: {str(e)}"}]}

# === DOCKER TOOLS ===
@srv.tool(
    "docker_status",
    {
        "service": {"type": "string", "description": "Имя сервиса (опционально)"}
    },
)
async def docker_status(params):
    try:
        service = params.get("service", "")
        if service:
            cmd = ["docker-compose", "ps", service]
        else:
            cmd = ["docker-compose", "ps"]
        
        process = subprocess.run(cmd, cwd="/opt/remosa", capture_output=True, text=True, timeout=30)
        
        result = {
            "service": service or "all",
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Docker error: {str(e)}"}]}

@srv.tool(
    "docker_restart",
    {
        "service": {"type": "string", "description": "Имя сервиса для перезапуска"}
    },
)
async def docker_restart(params):
    try:
        service = params["service"]
        cmd = ["docker-compose", "restart", service]
        
        process = subprocess.run(cmd, cwd="/opt/remosa", capture_output=True, text=True, timeout=60)
        
        result = {
            "service": service,
            "success": process.returncode == 0,
            "output": process.stdout,
            "error": process.stderr,
            "timestamp": datetime.now().isoformat()
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Restart error: {str(e)}"}]}

@srv.tool(
    "docker_logs",
    {
        "service": {"type": "string", "description": "Имя сервиса"},
        "lines": {"type": "integer", "default": 50, "description": "Количество строк лога"}
    },
)
async def docker_logs(params):
    try:
        service = params["service"]
        lines = params.get("lines", 50)
        cmd = ["docker-compose", "logs", "--tail", str(lines), service]
        
        process = subprocess.run(cmd, cwd="/opt/remosa", capture_output=True, text=True, timeout=30)
        
        result = {
            "service": service,
            "lines": lines,
            "success": process.returncode == 0,
            "logs": process.stdout,
            "error": process.stderr
        }
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Logs error: {str(e)}"}]}

@srv.tool(
    "docker_health",
    {},
)
async def docker_health(params):
    try:
        # Get container health status
        cmd = ["docker-compose", "ps", "--format", "json"]
        process = subprocess.run(cmd, cwd="/opt/remosa", capture_output=True, text=True, timeout=30)
        
        if process.returncode != 0:
            return {"content":[{"type":"text","text":f"Docker health check failed: {process.stderr}"}]}
        
        # Parse JSON output
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
        
        return {"content":[{"type":"json","data":result}]}
    except Exception as e:
        return {"content":[{"type":"text","text":f"Health check error: {str(e)}"}]}

async def cleanup():
    """Cleanup resources"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed")

async def main():
    try:
        await srv.connect(StdioServerTransport())
    finally:
        await cleanup()

if __name__ == "__main__":
    asyncio.run(main()) 