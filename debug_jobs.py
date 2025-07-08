#!/usr/bin/env python3
"""
Скрипт для диагностики проблемы с заданиями (jobs)
Выполняется внутри backend контейнера
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Настройки подключения к БД
DB_CONFIG = {
    'host': '192.168.1.178',
    'port': 5432,
    'database': 'remosa',
    'user': 'remosa',
    'password': '1234567890'
}

def connect_db():
    """Подключение к базе данных"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Ошибка подключения к БД: {e}")
        return None

def execute_query(conn, query, title):
    """Выполнение запроса и вывод результатов"""
    print(f"\n{'='*50}")
    print(f"🔍 {title}")
    print(f"{'='*50}")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            results = cur.fetchall()
            
            if not results:
                print("❌ Результатов нет")
                return
            
            # Выводим заголовки
            if results:
                headers = list(results[0].keys())
                print(" | ".join(headers))
                print("-" * (len(" | ".join(headers))))
                
                # Выводим данные
                for row in results:
                    values = [str(row[col]) for col in headers]
                    print(" | ".join(values))
                    
    except Exception as e:
        print(f"❌ Ошибка выполнения запроса: {e}")

def main():
    """Основная функция диагностики"""
    print("🚀 Начинаем диагностику проблемы с заданиями...")
    
    conn = connect_db()
    if not conn:
        return
    
    try:
        # 1. Структура таблицы jobs
        query1 = """
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        ORDER BY ordinal_position;
        """
        execute_query(conn, query1, "Структура таблицы jobs")
        
        # 2. Все записи в jobs
        query2 = """
        SELECT id, name, platform_id, conditions, actions, created_at, updated_at 
        FROM jobs 
        ORDER BY id;
        """
        execute_query(conn, query2, "Все записи в таблице jobs")
        
        # 3. Количество записей
        query3 = "SELECT COUNT(*) as total_jobs FROM jobs;"
        execute_query(conn, query3, "Общее количество заданий")
        
        # 4. Распределение по platform_id
        query4 = """
        SELECT platform_id, COUNT(*) as count 
        FROM jobs 
        GROUP BY platform_id 
        ORDER BY platform_id;
        """
        execute_query(conn, query4, "Распределение заданий по platform_id")
        
        # 5. Записи с NULL в conditions/actions
        query5 = """
        SELECT id, name, platform_id, conditions, actions 
        FROM jobs 
        WHERE conditions IS NULL OR actions IS NULL;
        """
        execute_query(conn, query5, "Задания с NULL в conditions/actions")
        
        # 6. Пользователь с id=2 и его платформы
        query6 = """
        SELECT u.id, u.email, u.role, up.platform_id
        FROM users u
        LEFT JOIN user_platforms up ON u.id = up.user_id
        WHERE u.id = 2
        ORDER BY u.id, up.platform_id;
        """
        execute_query(conn, query6, "Пользователь с id=2 и его платформы")
        
        # 7. Все платформы пользователя с id=2
        query7 = """
        SELECT up.user_id, up.platform_id, p.name as platform_name
        FROM user_platforms up
        LEFT JOIN platforms p ON up.platform_id = p.id
        WHERE up.user_id = 2
        ORDER BY up.platform_id;
        """
        execute_query(conn, query7, "Все платформы пользователя с id=2")
        
        # 8. Все платформы в системе
        query8 = """
        SELECT id, name, description 
        FROM platforms 
        ORDER BY id;
        """
        execute_query(conn, query8, "Все платформы в системе")
        
        # 9. Задания с platform_id = 2 или 7
        query9 = """
        SELECT id, name, platform_id 
        FROM jobs 
        WHERE platform_id IN (2, 7)
        ORDER BY platform_id, id;
        """
        execute_query(conn, query9, "Задания с platform_id = 2 или 7")
        
        # 10. Последние созданные задания
        query10 = """
        SELECT id, name, platform_id, created_at 
        FROM jobs 
        ORDER BY created_at DESC 
        LIMIT 10;
        """
        execute_query(conn, query10, "Последние созданные задания")
        
        print(f"\n{'='*50}")
        print("✅ Диагностика завершена")
        print(f"{'='*50}")
        
    except Exception as e:
        print(f"❌ Ошибка во время диагностики: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main() 