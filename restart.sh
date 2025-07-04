#!/bin/bash

echo "🔄 Перезапуск REMOSA с полной пересборкой..."

# Останавливаем все контейнеры
echo "🛑 Остановка контейнеров..."
docker-compose down -v

# Удаляем старые образы (опционально)
echo "🗑️ Очистка старых образов..."
docker-compose down --rmi local

# Пересобираем все образы
echo "🔨 Пересборка образов..."
docker-compose build --no-cache

# Запускаем контейнеры
echo "🚀 Запуск контейнеров..."
docker-compose up -d

# Показываем статус
echo "📊 Статус контейнеров:"
docker-compose ps

echo "✅ Готово! Логи можно посмотреть командой: docker-compose logs -f"
echo "🌐 Frontend: http://192.168.1.122"
echo "🔧 Backend API: http://192.168.1.122/api/v1"
echo "❤️ Health check: http://192.168.1.122/api/v1/health" 