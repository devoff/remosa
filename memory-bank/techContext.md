# Технический контекст

## Технологический стек

### Frontend
- **React** с TypeScript
- **React Router** для навигации
- **Tailwind CSS** для стилизации
- **Lucide React** для иконок

### Backend  
- **FastAPI** (Python)
- **Alembic** для миграций БД
- **SQLAlchemy** ORM
- **PostgreSQL** (предположительно)

### Инфраструктура
- **Docker** для контейнеризации
- **Docker Compose** для оркестрации
- **Grafana** для мониторинга
- **SMS Gateway** для отправки команд

### Архитектурные принципы
- **Микросервисная архитектура**
- **RESTful API**
- **Мультитенантность**
- **Контейнеризация**

## Интеграции
- **Grafana API**: Получение алертов
- **SMS API**: Отправка команд на устройства
- **Device API**: Управление устройствами

## Безопасность
- JWT авторизация
- Role-based access control (RBAC)
- Изоляция данных по платформам
- Аудит всех действий

## Развертывание
- Все сервисы работают в Docker контейнерах
- Миграции БД через Alembic из контейнера
- Конфигурация через environment variables

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
