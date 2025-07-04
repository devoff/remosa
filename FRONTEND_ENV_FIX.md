# Исправление проблемы с переменными окружения фронтенда

## Проблема
Фронтенд собирался с "зашитыми" значениями переменных окружения (`import.meta.env.VITE_API_URL`), которые Vite встраивает во время сборки и не могут быть изменены во runtime.

## Решение
Создали **runtime конфигурацию** через `window.APP_CONFIG`, которая загружается из отдельного файла `config.js` и заменяется во время запуска контейнера.

## Новые файлы

### 1. `/front_new/public/config.js` (новый)
Runtime конфигурация с плейсхолдерами:
```js
window.APP_CONFIG = {
  API_URL: '__VITE_API_URL_PLACEHOLDER__',
  WS_URL: '__VITE_WS_URL_PLACEHOLDER__',
  DEBUG_LOGGING: '__VITE_DEBUG_LOGGING_PLACEHOLDER__'
};
```

### 2. `/front_new/src/config/runtime.ts` (новый)
Утилита для получения runtime конфигурации:
```ts
export const getRuntimeConfig = () => {
  return {
    API_URL: window.APP_CONFIG?.API_URL || '/api/v1',
    WS_URL: window.APP_CONFIG?.WS_URL || '/ws',
    DEBUG_LOGGING: window.APP_CONFIG?.DEBUG_LOGGING || 'false'
  };
};
```

## Измененные файлы

### 3. `/front_new/index.html`
Добавлено подключение config.js:
```html
<script src="/config.js"></script>
```

### 4. `/front_new/src/utils/axios.js`
```js
// Было:
baseURL: import.meta.env.VITE_API_URL,
// Стало:
import { config } from '../config/runtime';
baseURL: config.API_URL,
```

### 2. `/front_new/src/App.tsx`
```tsx
// Было:
console.log('API URL:', import.meta.env.VITE_API_URL);
// Стало:
console.log('API URL:', '__VITE_API_URL_PLACEHOLDER__');
```

### 3. `/front_new/src/lib/api.js`
```js
// Было:
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
// Стало:
const API_BASE_URL = '__VITE_API_URL_PLACEHOLDER__' || '/api/v1';
```

### 4. `/front_new/src/lib/api.ts`
```ts
// Было:
const API_BASE_URL = import.meta.env.VITE_API_URL;
// Стало:
const API_BASE_URL = '__VITE_API_URL_PLACEHOLDER__';
```

### 5. Компоненты алертов
- `AlertsPage.tsx`
- `AlertsPanel.tsx`

### 6. Улучшенный entrypoint.sh
- Добавлен debug вывод переменных
- Рекурсивный поиск файлов в dist/
- Обработка .css файлов

## Настройка для продакшена

### В .env файле на продакшене:
```bash
VITE_API_URL=https://monitor.remosa.ru/api/v1
VITE_WS_URL=wss://monitor.remosa.ru/ws
ALLOWED_ORIGINS=["https://monitor.remosa.ru", "http://localhost:3000"]
```

### Обновить docker-compose.prod.yml:
```yaml
frontend:
  environment:
    NODE_ENV: production
    VITE_API_URL: ${VITE_API_URL}
    VITE_WS_URL: ${VITE_WS_URL}
    GENERATE_SOURCEMAP: "false"
```

## Команды для деплоя

1. **Обновить .env файл на продакшене**
2. **Пересобрать и запустить:**
```bash
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d
```

3. **Проверить логи:**
```bash
docker logs remosa-frontend-1
```

В логах должно быть:
```
=== ENTRYPOINT DEBUG ===
VITE_API_URL: https://monitor.remosa.ru/api/v1
VITE_WS_URL: wss://monitor.remosa.ru/ws
Processing file: /app/dist/index-xxx.js
=== REPLACEMENT COMPLETE ===
```

## Проверка
После деплоя в браузере должен исчезнуть запрос к `http://192.168.1.122/api/v1/auth/token` и появиться правильный запрос к `https://monitor.remosa.ru/api/v1/auth/token`. 