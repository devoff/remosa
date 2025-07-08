#!/usr/bin/env python3
"""
Скрипт для заполнения справочника метрик мониторинга начальными данными
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.monitoring_metric import MonitoringMetric


def seed_monitoring_metrics():
    """Заполнить справочник метрик начальными данными"""
    db = SessionLocal()
    
    # Список метрик для заполнения
    metrics_data = [
        {
            "technical_name": "remosa_exporter_cubic_device_status",
            "human_name": "Статус устройства",
            "description": "Текущий статус устройства (онлайн/офлайн)",
            "unit": None,
            "category": "Статус",
            "data_type": "number",
            "min_value": "0",
            "max_value": "1"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_temperature",
            "human_name": "Температура устройства",
            "description": "Текущая температура устройства",
            "unit": "°C",
            "category": "Температура",
            "data_type": "number",
            "min_value": "-40",
            "max_value": "85"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_humidity",
            "human_name": "Влажность воздуха",
            "description": "Текущая влажность воздуха вокруг устройства",
            "unit": "%",
            "category": "Влажность",
            "data_type": "number",
            "min_value": "0",
            "max_value": "100"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_power_consumption",
            "human_name": "Потребление энергии",
            "description": "Текущее потребление энергии устройством",
            "unit": "Вт",
            "category": "Питание",
            "data_type": "number",
            "min_value": "0",
            "max_value": "1000"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_voltage",
            "human_name": "Напряжение питания",
            "description": "Текущее напряжение питания устройства",
            "unit": "В",
            "category": "Питание",
            "data_type": "number",
            "min_value": "0",
            "max_value": "50"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_current",
            "human_name": "Ток потребления",
            "description": "Текущий ток потребления устройства",
            "unit": "А",
            "category": "Питание",
            "data_type": "number",
            "min_value": "0",
            "max_value": "10"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_signal_strength",
            "human_name": "Уровень сигнала",
            "description": "Уровень сигнала сети",
            "unit": "дБм",
            "category": "Связь",
            "data_type": "number",
            "min_value": "-120",
            "max_value": "0"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_uptime",
            "human_name": "Время работы",
            "description": "Время работы устройства с последнего перезапуска",
            "unit": "сек",
            "category": "Система",
            "data_type": "number",
            "min_value": "0",
            "max_value": None
        },
        {
            "technical_name": "remosa_exporter_cubic_device_memory_usage",
            "human_name": "Использование памяти",
            "description": "Процент использования памяти устройства",
            "unit": "%",
            "category": "Система",
            "data_type": "number",
            "min_value": "0",
            "max_value": "100"
        },
        {
            "technical_name": "remosa_exporter_cubic_device_cpu_usage",
            "human_name": "Загрузка процессора",
            "description": "Процент загрузки процессора устройства",
            "unit": "%",
            "category": "Система",
            "data_type": "number",
            "min_value": "0",
            "max_value": "100"
        }
    ]
    
    try:
        # Проверяем, есть ли уже метрики
        existing_count = db.query(MonitoringMetric).count()
        if existing_count > 0:
            print(f"В базе уже есть {existing_count} метрик. Пропускаем заполнение.")
            return
        
        # Добавляем метрики
        for metric_data in metrics_data:
            metric = MonitoringMetric(**metric_data)
            db.add(metric)
        
        db.commit()
        print(f"Добавлено {len(metrics_data)} метрик в справочник.")
        
    except Exception as e:
        print(f"Ошибка при заполнении метрик: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_monitoring_metrics() 