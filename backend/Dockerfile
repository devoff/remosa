FROM python:3.10-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем только нужные файлы
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/

# Устанавливаем PYTHONPATH для корректных импортов
ENV PYTHONPATH=/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]