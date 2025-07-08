# REMOSA RAG + MCP Server Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# System dependencies (faiss needs)
RUN apt-get update && apt-get install -y build-essential bash && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy RAG core and endpoints
COPY rag_system /app/rag_system
COPY rag_endpoints.py /app/rag_endpoints.py
COPY main.py /app/main.py
COPY mcp_server_http.py /app/mcp_server_http.py
COPY mcp_server_simple.py /app/mcp_server_simple.py
COPY start.sh /app/start.sh

# Expose ports: 9090 (RAG API), 9091 (MCP HTTP)
EXPOSE 9090 9091

# Запуск обоих сервисов через main.py
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"] 