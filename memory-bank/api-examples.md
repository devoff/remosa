# Примеры API-запросов и схем данных (REMOSA)

## Авторизация (получение токена)

**curl:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=yourpassword"
```

**axios:**
```js
const params = new URLSearchParams();
params.append('username', 'admin');
params.append('password', 'yourpassword');
axios.post('/api/v1/auth/token', params, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Получение списка платформ

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/platforms/ \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "Client1",
    "devices_limit": 10,
    "sms_limit": 1000
  }
]
```

---

## Добавление устройства

**curl:**
```bash
curl -X POST http://localhost:8000/api/v1/devices/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Device1", "platform_id": 1}'
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Device1",
  "platform_id": 1,
  "status": "active"
}
```

---

## Получение аудита платформы

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/platforms/1/audit/ \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "action": "create_device",
    "user_id": 2,
    "timestamp": "2024-07-07T12:34:56Z",
    "details": "Device1"
  }
]
```

---

## Пример: Получение шаблонов команд

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/commands/templates/ \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "model": "SmartSocket",
    "category": "Питание",
    "name": "Перезагрузка",
    "template": "#12#0#10#0#",
    "params": ["minutes"]
  }
]
```

---

## Пример: Создание задания (Job)

**curl:**
```bash
curl -X POST http://localhost:8000/api/v1/jobs/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Автоматическая перезагрузка",
    "platform_id": 1,
    "device_id": 1,
    "trigger": {"metric": "status", "operator": "=", "value": "offline"},
    "action": {"type": "command", "template_id": 1, "params": {"minutes": 5}}
  }'
```

**Ответ:**
```json
{
  "id": 1,
  "name": "Автоматическая перезагрузка",
  "platform_id": 1,
  "device_id": 1,
  "is_active": true,
  "trigger": {"metric": "status", "operator": "=", "value": "offline"},
  "action": {"type": "command", "template_id": 1, "params": {"minutes": 5}}
}
```

---

## Пример: Получение метрик устройства из Prometheus

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/jobs/prometheus/metrics/AA:BB:CC:DD:EE:FF \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
{
  "temperature": 42.5,
  "voltage": 220,
  "status": "online"
}
```

---

## Пример: Получение логов

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/logs/ \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "timestamp": "2024-07-07T12:34:56Z",
    "level": "INFO",
    "message": "Device1 rebooted",
    "platform_id": 1
  }
]
```

---

## Пример: Получение пользователей платформы

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/platforms/1/users \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 2,
    "username": "manager",
    "role": "manager"
  }
]
```

---

## Пример: Получение всех экспортеров

**curl:**
```bash
curl -X GET http://localhost:8000/api/v1/exporters/ \
  -H "Authorization: Bearer <access_token>"
```

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "CubicExporter",
    "platform_id": 1,
    "status": "active"
  }
]
```

---

> **Все примеры и схемы данных актуальны для версии OpenAPI, выгруженной в memory-bank/openapi.json.** 