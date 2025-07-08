#!/bin/bash

# Запуск FastAPI (RAG API)
uvicorn main:app --host 0.0.0.0 --port 9090 &

# Запуск MCP сервера
python mcp_server_http.py 