FROM python:3.11-slim

WORKDIR /app

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN groupadd -r exporter && useradd -r -g exporter exporter
RUN chown -R exporter:exporter /app

# Создаем директорию для логов
RUN mkdir -p /tmp && chown -R exporter:exporter /tmp

USER exporter

# Открываем порт
EXPOSE 9001

# Команда запуска
CMD ["python", "main.py"]