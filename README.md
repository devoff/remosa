# Remosa - Система мониторинга устройств

Remosa - это система мониторинга и управления устройствами, построенная с использованием современного стека технологий.

## Технологии

### Backend
- Python 3.10
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- React Router

### Инфраструктура
- Docker
- Docker Compose
- Nginx

## Установка и запуск

### Предварительные требования
- Docker
- Docker Compose
- Git

### Шаги установки

1. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/remosa.git
cd remosa
```

2. Создайте файл .env с необходимыми переменными окружения:
```bash
# Database
DATABASE_URL=postgresql://remosa:1234567890@db:5432/remosa

# SMS Gateway (опционально)
SMS_GATEWAY_URL=
SMS_GATEWAY_API_KEY=
```

3. Запустите приложение:
```bash
docker-compose up -d
```

4. Откройте браузер и перейдите по адресу:
```
http://localhost
```

## Структура проекта

```
remosa/
├── backend/             # FastAPI backend
│   ├── app/
│   │   ├── api/        # API endpoints
│   │   ├── core/       # Core functionality
│   │   ├── models/     # Database models
│   │   └── services/   # Business logic
│   └── requirements.txt
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   └── App.tsx    # Main app component
│   └── package.json
├── nginx/             # Nginx configuration
├── docker-compose.yml # Docker compose configuration
└── README.md         # Project documentation
```

## API Endpoints

### Устройства
- `GET /api/v1/devices/` - Получить список устройств
- `POST /api/v1/devices/` - Создать новое устройство

## Разработка

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Лицензия

MIT 

## Управление платформами, ролями и лимитами

### Основные возможности

- **Платформы** — изолированные пространства для клиентов, с индивидуальными лимитами на устройства и SMS.
- **Роли пользователей** — гибкая система доступа: superadmin, admin платформы, manager, user, viewer.
- **Лимиты** — ограничение количества устройств и SMS на платформе (назначает только superadmin).
- **Аудит** — история всех изменений по платформе, пользователям и устройствам.

### Эндпоинты API

| Метод | URL | Описание | Доступ |
|-------|-----|----------|--------|
| POST  | /platforms/ | Создать платформу | superadmin |
| GET   | /platforms/ | Список платформ | superadmin |
| GET   | /platforms/{platform_id} | Детали платформы | superadmin |
| PATCH | /platforms/{platform_id} | Редактировать платформу/лимиты | superadmin |
| DELETE| /platforms/{platform_id} | Удалить платформу | superadmin |
| POST  | /platforms/{platform_id}/users/ | Добавить пользователя | admin/manager |
| PATCH | /platforms/{platform_id}/users/{platform_user_id} | Изменить роль пользователя | admin/manager |
| DELETE| /platforms/{platform_id}/users/{platform_user_id} | Удалить пользователя | admin/manager |
| GET   | /platforms/{platform_id}/users/ | Список пользователей | все роли |
| GET   | /platforms/{platform_id}/devices/ | Список устройств | все роли |
| POST  | /platforms/{platform_id}/devices/ | Добавить устройство (с лимитом) | admin/manager |
| DELETE| /platforms/{platform_id}/devices/{device_id} | Удалить устройство | admin/manager |
| GET   | /platforms/{platform_id}/audit/ | История изменений | admin/manager |

### Ролевой доступ (RBAC)

| Роль         | Управление платформами | Управление пользователями | Управление лимитами | Управление устройствами | Просмотр | Аудит |
|--------------|:---------------------:|:------------------------:|:-------------------:|:----------------------:|:--------:|:-----:|
| superadmin   | ✔️                    | ✔️                       | ✔️                  | ✔️                     | ✔️       | ✔️    |
| admin        | ❌                    | ✔️ (в своей платформе)    | ❌                  | ✔️ (в своей платформе)  | ✔️       | ✔️    |
| manager      | ❌                    | ✔️ (в своей платформе)    | ❌                  | ✔️ (в своей платформе)  | ✔️       | ✔️    |
| user         | ❌                    | ❌                       | ❌                  | ✔️ (только свои)        | ✔️       | ❌    |
| viewer       | ❌                    | ❌                       | ❌                  | ❌                     | ✔️       | ❌    |

### Примеры сценариев

- **Супер-админ** создаёт платформу, назначает лимиты, добавляет админа платформы.
- **Админ платформы** добавляет пользователей и устройства, следит за лимитами.
- **Менеджер** управляет устройствами и пользователями, но не лимитами.
- **User/Viewer** — только просмотр.

### Аудит

- Все действия по платформе, пользователям и устройствам фиксируются.
- Историю можно получить через `/platforms/{platform_id}/audit/`.

### Swagger/OpenAPI

- Вся документация доступна по адресу `/docs` после запуска сервера.

### Примеры curl-запросов

```bash
# Создать платформу (superadmin)
curl -X POST http://localhost:8000/platforms/ \
  -H "Authorization: Bearer <superadmin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Client1", "devices_limit": 10, "sms_limit": 1000}'

# Добавить пользователя в платформу (admin)
curl -X POST http://localhost:8000/platforms/1/users/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "role": "manager"}'

# Добавить устройство (admin/manager)
curl -X POST http://localhost:8000/platforms/1/devices/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Device1"}'

# Получить аудит
curl -X GET http://localhost:8000/platforms/1/audit/ \
  -H "Authorization: Bearer <admin_token>"
``` 