#!/usr/bin/env python3
"""
Скрипт для исправления проблем с миграциями на продакшене
"""
import os
import sys
import psycopg2
from alembic.config import Config
from alembic import command

def get_db_connection():
    """Получение подключения к базе данных"""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        port=os.getenv('POSTGRES_PORT', 5432),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD')
    )

def check_current_version():
    """Проверка текущей версии миграций"""
    try:
        cfg = Config('alembic.ini')
        command.current(cfg)
        return True
    except Exception as e:
        print(f"Ошибка при проверке версии: {e}")
        return False

def check_database_state():
    """Проверка состояния базы данных"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    print("=== ПРОВЕРКА СОСТОЯНИЯ БАЗЫ ДАННЫХ ===")
    
    # Проверим существующие таблицы
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    print(f"Существующие таблицы: {', '.join(tables)}")
    
    # Проверим колонку user_id в devices
    if 'devices' in tables:
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'devices' AND column_name = 'user_id'
        """)
        user_id_exists = cur.fetchone() is not None
        print(f"Колонка user_id в devices: {'существует' if user_id_exists else 'отсутствует'}")
    
    # Проверим колонку platform_id в devices
    if 'devices' in tables:
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'devices' AND column_name = 'platform_id'
        """)
        platform_id_exists = cur.fetchone() is not None
        print(f"Колонка platform_id в devices: {'существует' if platform_id_exists else 'отсутствует'}")
    
    # Проверим текущую версию alembic
    if 'alembic_version' in tables:
        cur.execute("SELECT version_num FROM alembic_version")
        version = cur.fetchone()
        print(f"Текущая версия Alembic: {version[0] if version else 'не найдена'}")
    
    conn.close()

def mark_migration_as_completed(revision_id):
    """Пометить миграцию как выполненную без фактического выполнения"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("UPDATE alembic_version SET version_num = %s", (revision_id,))
    conn.commit()
    conn.close()
    print(f"✓ Миграция {revision_id} помечена как выполненная")

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == 'check':
            check_database_state()
        elif sys.argv[1] == 'mark' and len(sys.argv) > 2:
            mark_migration_as_completed(sys.argv[2])
        elif sys.argv[1] == 'upgrade':
            try:
                cfg = Config('alembic.ini')
                command.upgrade(cfg, 'head')
                print("✓ Миграции успешно выполнены")
            except Exception as e:
                print(f"Ошибка при выполнении миграций: {e}")
    else:
        print("Использование:")
        print("  python fix_migrations.py check          - проверить состояние БД")
        print("  python fix_migrations.py mark REVISION  - пометить миграцию как выполненную")  
        print("  python fix_migrations.py upgrade        - выполнить миграции")

if __name__ == '__main__':
    main() 