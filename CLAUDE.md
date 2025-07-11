# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remosa is a multi-tenant device monitoring system built with FastAPI backend and React frontend. It provides device management, command execution, alerting, and role-based access control across isolated platforms.

**⚠️ PRE-PRODUCTION CONTEXT**: This is a pre-production branch with an older version of the application that needs to be enhanced. Many features documented in `/memory-bank/` are planned but not yet implemented in this branch.

## Key Development Commands

### Docker Development
```bash
# Full rebuild and restart
./restart.sh

# Start services
docker-compose up -d

# View logs
./logs.sh [backend|frontend|nginx|all|auth|database|errors]

# Stop services
docker-compose down -v
```

### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Health check
curl http://localhost:8000/health
```

### Frontend Development
```bash
cd front_new

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Architecture Overview

### Multi-Tenant Platform System
- **Superadmin**: Full system access, creates platforms, manages limits
- **Platform Admin**: Manages users/devices within their platform
- **Platform Users**: Limited access to devices within their platform
- **Platform Isolation**: Complete data separation between platforms

### Backend Structure
- **FastAPI** with async support
- **SQLAlchemy** ORM with Alembic migrations
- **PostgreSQL** primary database
- **Redis** for caching and sessions
- **JWT** authentication with role-based access control

### Frontend Structure
- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Zustand** for state management

## Key Models & Relationships

### Platform System
- `Platform` → `PlatformUser` → `User` (many-to-many with roles)
- `Platform` → `Device` (one-to-many with limits)
- `Platform` → `AuditLog` (tracks all platform actions)

### Device Management
- `Device` → `CommandLog` (command execution history)
- `Device` → `CommandTemplate` (available commands by model)
- `Alert` → `Device` (monitoring alerts)

### Role-Based Access Control
Located in `backend/app/core/platform_permissions.py`:
- Permission decorators for endpoints
- Platform isolation enforcement
- Role hierarchy validation

## Configuration

### Environment Variables
Key variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET_KEY`: JWT token signing
- `REDIS_URL`: Redis connection
- `VITE_API_URL`: Frontend API endpoint
- `SMS_GATEWAY_*`: SMS integration settings

### Settings Management
All configuration in `backend/app/core/config.py` using Pydantic settings.

## Database Migrations

### Alembic Workflow
```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Check current version
alembic current
```

### Migration Files
Located in `backend/alembic/versions/` - follow naming convention with timestamps.

## API Structure

### Route Organization
- `/api/v1/auth/` - Authentication endpoints
- `/api/v1/platforms/` - Platform management (superadmin only)
- `/api/v1/platforms/{id}/users/` - Platform user management
- `/api/v1/platforms/{id}/devices/` - Platform device management
- `/api/v1/devices/` - Device operations
- `/api/v1/commands/` - Command execution
- `/api/v1/alerts/` - Alert management

### Platform-Scoped Endpoints
Most endpoints are platform-scoped and automatically filter by user's platform access.

## Security & Permissions

### Role Hierarchy
1. **superadmin**: System-wide access
2. **admin**: Platform administration
3. **manager**: Platform management
4. **user**: Limited device access
5. **viewer**: Read-only access

### Permission Decorators
Use `@require_platform_permission()` decorator for endpoint protection:
```python
@require_platform_permission(roles=["admin", "manager"])
async def create_device(...)
```

## Frontend Patterns

### State Management
- **Zustand** stores in `src/store/`
- **React Query** for API state management
- **Context** for authentication state

### Component Structure
- `components/` - Reusable UI components
- Page components organized by feature
- Platform-aware routing and navigation

### API Integration
- Axios instance with JWT interceptors in `src/lib/api.ts`
- Platform context passed with requests
- Error handling with toast notifications

## Testing & Development

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd front_new
npm test
```

### Integration Testing
Test files in `backend/tests/` including platform isolation tests.

## Common Development Patterns

### Adding New Platform Features
1. Create models in `backend/app/models/`
2. Add schemas in `backend/app/schemas/`
3. Implement endpoints with platform permissions
4. Add frontend components with platform context
5. Create database migration

### Platform Permission Implementation
Always use platform-scoped queries:
```python
devices = session.query(Device).filter(
    Device.platform_id == current_user.platform_id
).all()
```

### Error Handling
- Backend: FastAPI HTTP exceptions
- Frontend: Axios interceptors with toast notifications
- Platform access violations return 403 Forbidden

## Memory Bank Context (PRE-PRODUCTION VISION)

The `memory-bank/` directory contains comprehensive project documentation representing the intended vision and architecture. **Important**: Most features documented here are NOT yet implemented in this pre-production branch.

### Key Documentation:
- `techContext.md` - Technical architecture details
- `systemPatterns.md` - Role system and security patterns  
- `tasks.md` - Development roadmap and feature tracking
- `reflection/` - Implementation lessons learned
- `projectbrief.md` - Core project concept and business value
- `productContext.md` - Product vision and requirements
- `style-guide.md` - UI/UX consistency guidelines

### Critical Security & Architecture Guidelines (from memory-bank):
1. **Platform Isolation**: Every database query MUST include `platform_id` filtering
2. **Role-Based Security**: Never trust frontend-only permission checks
3. **Audit Logging**: All significant actions must be logged with platform context
4. **Multi-Tenant Architecture**: Complete data segregation between client platforms
5. **Performance**: Server-side filtering, never client-side filter large datasets

### Planned Features (Not Yet Implemented):
- Jobs & Scheduling System
- Prometheus Integration  
- Exporter Management
- RAG (AI-powered assistance)
- Advanced Notifications
- Platform Exporters
- Enhanced Monitoring Metrics

### Development Patterns to Follow:
- **API-first design**: Backend drives frontend contracts
- **Type-safe interfaces**: Pydantic schemas for validation
- **Modular architecture**: Easy to extend with new features
- **Comprehensive error handling**: Centralized error management
- **Platform-aware components**: All UI respects platform boundaries

## SMS Integration

Device commands sent via SMS gateway:
- Configuration in `backend/app/core/config.py`
- SMS polling service in `backend/app/services/sms_poller.py`
- Command templates in database define SMS formats

## Monitoring & Alerting

### Grafana Integration
- Webhook endpoint for alert processing
- Alert storage and notification system
- Platform-scoped alert viewing

### Health Checks
- Backend: `/health` endpoint
- Database connectivity checks
- JWT configuration validation

## Production Deployment

### Docker Compose
- `docker-compose.yml` for development
- `docker-compose.prod.yml` for production
- Nginx reverse proxy configuration

### Scripts
- `restart.sh` - Full rebuild and restart
- `logs.sh` - Log viewing with filtering
- `fix_production_env.sh` - Environment fixes