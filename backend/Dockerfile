FROM python:3.10-slim

WORKDIR /app

# Устанавливаем зависимости
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
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload