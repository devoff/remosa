#!/bin/bash

# Скрипт для исправления .env файла на продакшене

echo "🔧 Исправляем .env файл для продакшена..."

# Создаем бэкап
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Создан бэкап .env файла"

# Исправляем URL
sed -i 's|API_URL=https://monitor.remosa.ru:8000|API_URL=https://monitor.remosa.ru/api/v1|g' .env
sed -i 's|WS_URL=ws://monitor.remosa.ru:8000/ws|WS_URL=wss://monitor.remosa.ru/ws|g' .env
sed -i 's|VITE_WS_URL=ws://monitor.remosa.ru:8000/ws|VITE_WS_URL=wss://monitor.remosa.ru/ws|g' .env

echo "✅ URL исправлены в .env файле"

# Показываем что изменилось
echo "📋 Текущие настройки URL:"
grep -E "(API_URL|WS_URL|VITE_WS_URL)" .env

echo ""
echo ""
echo "🚀 Теперь выполните:"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker-compose -f docker-compose.prod.yml build"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "✅ После запуска проверьте:"
echo "docker-compose -f docker-compose.prod.yml exec frontend cat /app/dist/config.js"
echo ""
echo "📋 Ожидаемый результат:"
echo "window.APP_CONFIG = {"
echo "  API_URL: 'https://monitor.remosa.ru/api/v1',"
echo "  WS_URL: 'wss://monitor.remosa.ru/ws',"
echo "  DEBUG_LOGGING: 'true'"
echo "};" 