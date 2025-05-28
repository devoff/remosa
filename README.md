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