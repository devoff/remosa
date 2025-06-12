#!/bin/bash

echo "📋 REMOSA - Просмотр логов"
echo "=========================="

case "$1" in
    "backend"|"b")
        echo "🔧 Логи Backend:"
        docker-compose logs -f backend
        ;;
    "frontend"|"f")
        echo "🌐 Логи Frontend:"
        docker-compose logs -f frontend
        ;;
    "nginx"|"n")
        echo "🔀 Логи Nginx:"
        docker-compose logs -f nginx
        ;;
    "all"|""|"a")
        echo "📊 Логи всех сервисов:"
        docker-compose logs -f
        ;;
    "auth"|"auth-debug")
        echo "🔐 Логи авторизации (только backend с фильтром):"
        docker-compose logs -f backend | grep -i "auth\|jwt\|token\|login"
        ;;
    "database"|"db")
        echo "🗄️ Логи базы данных (только backend с фильтром):"
        docker-compose logs -f backend | grep -i "database\|postgres\|sql"
        ;;
    "errors"|"err")
        echo "❌ Только ошибки:"
        docker-compose logs -f | grep -i "error\|exception\|failed\|critical"
        ;;
    *)
        echo "Использование: $0 [backend|frontend|nginx|all|auth|database|errors]"
        echo ""
        echo "Команды:"
        echo "  backend, b     - Логи backend сервиса"
        echo "  frontend, f    - Логи frontend сервиса"
        echo "  nginx, n       - Логи nginx сервиса"
        echo "  all, a         - Логи всех сервисов (по умолчанию)"
        echo "  auth           - Логи авторизации"
        echo "  database, db   - Логи базы данных"
        echo "  errors, err    - Только ошибки"
        echo ""
        echo "Примеры:"
        echo "  ./logs.sh backend"
        echo "  ./logs.sh auth"
        echo "  ./logs.sh errors"
        ;;
esac 