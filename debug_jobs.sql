-- Диагностика проблемы с заданиями (jobs)
-- Выполнить в PostgreSQL на 192.168.1.178:5432

-- 1. Проверим структуру таблицы jobs
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- 2. Посмотрим все записи в таблице jobs
SELECT id, name, platform_id, conditions, actions, created_at, updated_at 
FROM jobs 
ORDER BY id;

-- 3. Проверим количество записей
SELECT COUNT(*) as total_jobs FROM jobs;

-- 4. Проверим распределение по platform_id
SELECT platform_id, COUNT(*) as count 
FROM jobs 
GROUP BY platform_id 
ORDER BY platform_id;

-- 5. Проверим записи с NULL в conditions/actions
SELECT id, name, platform_id, conditions, actions 
FROM jobs 
WHERE conditions IS NULL OR actions IS NULL;

-- 6. Проверим пользователей и их платформы
SELECT u.id, u.email, u.role, up.platform_id
FROM users u
LEFT JOIN user_platforms up ON u.id = up.user_id
WHERE u.id = 2
ORDER BY u.id, up.platform_id;

-- 7. Проверим все платформы пользователя с id=2
SELECT up.user_id, up.platform_id, p.name as platform_name
FROM user_platforms up
LEFT JOIN platforms p ON up.platform_id = p.id
WHERE up.user_id = 2
ORDER BY up.platform_id;

-- 8. Проверим все платформы в системе
SELECT id, name, description 
FROM platforms 
ORDER BY id;

-- 9. Проверим, есть ли задания с platform_id = 2 или 7
SELECT id, name, platform_id 
FROM jobs 
WHERE platform_id IN (2, 7)
ORDER BY platform_id, id;

-- 10. Проверим последние созданные задания
SELECT id, name, platform_id, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10; 