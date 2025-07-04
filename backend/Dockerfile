FROM python:3.10-slim

WORKDIR /app

# Устанавливаем системные зависимости для healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Устанавливаем зависимости Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем файлы
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/

# Устанавливаем PYTHONPATH
ENV PYTHONPATH=/app
ENV PATH="/usr/local/bin:$PATH"

# Запускаем миграции и сервер
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --reload