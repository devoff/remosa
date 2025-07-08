import os
import asyncio
import threading
from fastapi import FastAPI
import logging

from rag_endpoints import router as rag_router

app = FastAPI(title="REMOSA RAG API", version="1.0.0")
app.include_router(rag_router)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_service.main")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


def start_mcp_server():
    """Start MCP HTTP server in background thread"""
    try:
        import subprocess
        import os
        import time
        logger.info("Starting MCP HTTP server on port 8081...")
        
        # Start MCP server as background process
        mcp_process = subprocess.Popen([
            "python", "mcp_server_http.py"
        ], cwd="/app", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if process is still running
        if mcp_process.poll() is None:
            logger.info("✅ MCP HTTP server started successfully on port 8081")
        else:
            stdout, stderr = mcp_process.communicate()
            logger.error(f"❌ MCP server failed to start: {stderr.decode()}")
            
    except Exception as e:
        logger.error(f"Failed to start MCP server: {e}")

if __name__ == "__main__":
    import uvicorn
    try:
        # Start MCP server in background
        mcp_thread = threading.Thread(target=start_mcp_server, daemon=True)
        mcp_thread.start()
        
        logger.info("Starting FastAPI app...")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=int(os.getenv("API_PORT", "9091")),
            workers=1,
            reload=False,
        )
    except Exception as e:
        logger.exception(f"Failed to start FastAPI app: {e}") 