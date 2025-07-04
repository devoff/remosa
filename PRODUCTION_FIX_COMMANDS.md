# Исправление продакшена - Mixed Content и роли

## Проблемы на продакшене:
1. ❌ **Mixed Content Error** - HTTPS сайт делает HTTP запросы
2. ❌ **403 Forbidden** - проблема с ролями superadmin  
3. ❌ **Неправильные URL** в `.env` файле

## 1. Остановить продакшн контейнеры
```bash
docker-compose -f docker-compose.prod.yml down
```

## 2. Исправить .env файл на продакшене
Замените эти строки в `/opt/remosa/.env`:

### Заменить:
```bash
API_URL=https://monitor.remosa.ru:8000
WS_URL=ws://monitor.remosa.ru:8000/ws  
VITE_WS_URL=ws://monitor.remosa.ru:8000/ws
```

### На:
```bash
API_URL=https://monitor.remosa.ru/api/v1
WS_URL=wss://monitor.remosa.ru/ws
VITE_WS_URL=wss://monitor.remosa.ru/ws
```

### Или выполнить скрипт:
```bash
./fix_production_env.sh
```

## 3. Пересобрать и запустить с обновленными исправлениями роли
```bash
# Пересобрать контейнеры с исправлениями
docker-compose -f docker-compose.prod.yml build

# Запустить продакшн
docker-compose -f docker-compose.prod.yml up -d
```

## 4. Проверить логи
```bash
# Проверить логи frontend
docker-compose -f docker-compose.prod.yml logs frontend | tail -10

# Проверить что config.js обновился правильно
docker-compose -f docker-compose.prod.yml exec frontend cat /app/dist/config.js
```

## Ожидаемый результат в config.js:
```javascript
window.APP_CONFIG = {
  API_URL: 'https://monitor.remosa.ru/api/v1',
  WS_URL: 'wss://monitor.remosa.ru/ws',
  DEBUG_LOGGING: 'true'
};
```

## 5. Проверить работу
Откройте https://monitor.remosa.ru и проверьте:
- Нет ошибок Mixed Content в консоли
- Sidebar отображается для superadmin
- Устройства загружаются
- API запросы проходят успешно 