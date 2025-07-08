# Технический контекст

## Технологический стек

### Frontend
- **React 18** с TypeScript
- **React Router** для навигации
- **Tailwind CSS** для стилизации
- **Lucide React** для иконок
- **Material-UI (MUI)** для UI компонентов
- **Antd** для дополнительных компонентов
- **Vite** для сборки
- **Axios** для HTTP запросов
- **Zustand** для управления состоянием
- **ReactFlow** для диаграмм и схем

### Backend  
- **FastAPI** (Python 3.10+)
- **Alembic** для миграций БД
- **SQLAlchemy** ORM
- **PostgreSQL** база данных
- **Redis** для кэширования
- **AsyncIO** для асинхронных операций
- **Pydantic** для валидации данных
- **JWT** для авторизации

### Инфраструктура
- **Docker** для контейнеризации
- **Docker Compose** для оркестрации
- **Nginx** для reverse proxy
- **Prometheus** для мониторинга метрик
- **Grafana** для визуализации
- **SMS Gateway** для отправки команд

### Архитектурные принципы
- **Микросервисная архитектура**
- **RESTful API**
- **Мультитенантность** (платформы)
- **Контейнеризация**
- **Event-driven architecture**
- **Background tasks** для автоматизации

## Интеграции
- **Grafana API**: Получение алертов
- **SMS API**: Отправка команд на устройства
- **Prometheus API**: Мониторинг метрик
- **Device API**: Управление устройствами
- **Telegram API**: Уведомления
- **Docker API**: Управление контейнерами

## Безопасность
- JWT авторизация
- Role-based access control (RBAC)
- Изоляция данных по платформам
- Аудит всех действий
- CORS настройки
- Защищенные webhook endpoints

## Развертывание
- Все сервисы работают в Docker контейнерах
- Миграции БД через Alembic из контейнера
- Конфигурация через environment variables
- Health checks для всех сервисов
- Автоматические перезапуски

## Архитектура данных
- **Многоуровневая архитектура**: API -> Services -> Models -> Database
- **Изоляция по платформам**: Все данные привязаны к платформам
- **Аудит**: Все изменения логируются
- **Soft deletes**: Данные не удаляются физически

## Фоновые задачи
- **SMS Polling**: Опрос SMS шлюза
- **Prometheus Monitoring**: Мониторинг метрик
- **Job Processing**: Обработка автоматических заданий
- **Alert Processing**: Обработка алертов

# Стандарт авторизации фронта (фиксировано)

- Для авторизации на backend (эндпоинт /api/v1/auth/token) фронтенд всегда отправляет запрос в формате application/x-www-form-urlencoded (form-data) с помощью URLSearchParams.
- Поля: username, password.
- Пример:
  ```js
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  axios.post('/api/v1/auth/token', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  ```
- Полученный access_token сохраняется в localStorage под ключом access_token.
- Для всех последующих запросов токен автоматически подставляется в заголовок Authorization: Bearer ... через интерцептор axios.
- Любые отклонения от этого стандарта запрещены.
