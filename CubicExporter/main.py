print("=== DEBUG MAIN.PY LOADED ===")

import os
import requests
import sqlite3
from flask import Flask, Response
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from dotenv import load_dotenv
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import logging

# Настройка логирования: и в stdout, и в файл
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/exporter.log', mode='a', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()

EXTERNAL_API_BASE_URL = os.getenv('EXTERNAL_API_BASE_URL')
REMOSA_API_URL = os.getenv('REMOSA_API_URL')
EXPORTER_PORT = int(os.getenv('EXPORTER_PORT', 9000))
DB_FILE = os.getenv('CACHE_DB_FILE', './device_cache.db')
DEBUG_MODE = os.getenv('DEBUG_MODE', '0') == '1'

# Максимальное количество параллельных запросов
MAX_WORKERS = 10

app = Flask(__name__)

# --- Кэширование в SQLite ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS device_info (
            mac TEXT PRIMARY KEY,
            name TEXT,
            ip TEXT,
            outip TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_cached_device_info(mac):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT name, ip, outip FROM device_info WHERE mac = ?', (mac,))
    result = cursor.fetchone()
    conn.close()
    if result:
        return {'name': result[0], 'ip': result[1], 'outip': result[2]}
    return {}

def update_cached_device_info(mac, name, ip, outip):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO device_info (mac, name, ip, outip)
        VALUES (?, ?, ?, ?)
    ''', (mac, name, ip, outip))
    conn.commit()
    conn.close()

init_db()

# --- Получение списка устройств с REMOSA API ---
def fetch_devices():
    try:
        logger.info(f"[fetch_devices] GET {REMOSA_API_URL}")
        resp = requests.get(REMOSA_API_URL, timeout=10)
        resp.raise_for_status()
        devices = resp.json()
        logger.info(f"[fetch_devices] Получено {len(devices)} устройств из REMOSA API: {devices}")
        return devices
    except Exception as e:
        logger.error(f"[fetch_devices] Ошибка получения устройств с REMOSA API: {e}")
        return []

# --- Получение статуса устройства через внешний API ---
def fetch_status(device):
    mac = device.get('mac', 'unknown')
    platform_id = str(device.get('platform_id', 'unknown'))
    exporter_id = str(device.get('exporter_id', 'unknown'))
    
    api_url = f"{EXTERNAL_API_BASE_URL}{mac}"
    try:
        logger.info(f"[fetch_status] GET {api_url}")
        resp = requests.get(api_url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"[fetch_status] Ответ для MAC {mac}: {data}")
        
        if data and isinstance(data, list) and len(data) > 0:
            item = data[0]
            status_value = 1 if item.get('status') == 'online' else 0
            name = item.get('name', 'unknown')
            ip = item.get('ip', 'unknown')
            outip = item.get('outIp', 'unknown')
            
            # Обновляем кэш
            update_cached_device_info(mac, name, ip, outip)
            
            logger.info(f"[fetch_status] MAC {mac}: Статус - {item.get('status')}, Имя - {name}")
            
            return {
                'mac': mac,
                'platform_id': platform_id,
                'exporter_id': exporter_id,
                'status': status_value,
                'name': name,
                'ip': ip,
                'outip': outip,
                'error': None
            }
        else:
            logger.warning(f"[fetch_status] Нет данных или неверный формат JSON для MAC: {mac}")
            cached_info = get_cached_device_info(mac)
            return {
                'mac': mac,
                'platform_id': platform_id,
                'exporter_id': exporter_id,
                'status': 0,
                'name': cached_info.get('name', 'unknown'),
                'ip': cached_info.get('ip', 'unknown'),
                'outip': cached_info.get('outip', 'unknown'),
                'error': 'no_data'
            }
    except requests.exceptions.RequestException as e:
        logger.error(f"[fetch_status] Ошибка при запросе к API для MAC {mac}: {e}")
        cached_info = get_cached_device_info(mac)
        return {
            'mac': mac,
            'platform_id': platform_id,
            'exporter_id': exporter_id,
            'status': 0,
            'name': cached_info.get('name', 'unknown'),
            'ip': cached_info.get('ip', 'unknown'),
            'outip': cached_info.get('outip', 'unknown'),
            'error': str(e)
        }
    except Exception as e:
        logger.error(f"[fetch_status] Неожиданная ошибка для MAC {mac}: {e}")
        cached_info = get_cached_device_info(mac)
        return {
            'mac': mac,
            'platform_id': platform_id,
            'exporter_id': exporter_id,
            'status': 0,
            'name': cached_info.get('name', 'unknown'),
            'ip': cached_info.get('ip', 'unknown'),
            'outip': cached_info.get('outip', 'unknown'),
            'error': str(e)
        }

@app.route('/')
def home():
    return 'CubicExporter is running! Access /metrics for Prometheus metrics.'

@app.route('/metrics')
def metrics():
    debug_print(f"=== НАЧАЛО ОБРАБОТКИ /metrics === {datetime.now()}")
    registry = CollectorRegistry()
    status_gauge = Gauge(
        'remosa_exporter_cubic_device_status',
        'Статус устройства (1 - онлайн, 0 - оффлайн)',
        ['platform_id', 'exporter_id', 'mac'],
        registry=registry
    )
    info_gauge = Gauge(
        'remosa_exporter_cubic_device_info',
        'Информация об устройстве (лейблы: platform_id, exporter_id, mac, name, ip, outip)',
        ['platform_id', 'exporter_id', 'mac', 'name', 'ip', 'outip'],
        registry=registry
    )

    debug_print("Вызываю fetch_devices()...")
    devices = fetch_devices()
    debug_print(f"fetch_devices() вернул: {devices}")
    
    if not devices:
        debug_print("Нет устройств для обработки")
        return Response(generate_latest(registry), mimetype='text/plain')

    debug_print(f"Начинаю параллельную обработку {len(devices)} устройств")

    def debug_fetch_status(device):
        mac = device.get('mac', 'unknown')
        platform_id = str(device.get('platform_id', 'unknown'))
        exporter_id = str(device.get('exporter_id', 'unknown'))
        api_url = f"{EXTERNAL_API_BASE_URL}{mac}"
        debug_print(f"[fetch_status] Формирую URL: {api_url}")
        try:
            debug_print(f"[fetch_status] GET {api_url}")
            resp = requests.get(api_url, timeout=15)
            debug_print(f"[fetch_status] Ответ код: {resp.status_code}")
            debug_print(f"[fetch_status] Ответ RAW: {resp.text}")
            resp.raise_for_status()
            data = resp.json()
            debug_print(f"[fetch_status] Ответ JSON для MAC {mac}: {data}")
            if data and isinstance(data, list) and len(data) > 0:
                item = data[0]
                status_value = 1 if item.get('status') == 'online' else 0
                name = item.get('name', 'unknown')
                ip = item.get('ip', 'unknown')
                outip = item.get('outIp', 'unknown')
                update_cached_device_info(mac, name, ip, outip)
                debug_print(f"[fetch_status] MAC {mac}: Статус - {item.get('status')}, Имя - {name}, IP - {ip}, OutIP - {outip}")
                return {
                    'mac': mac,
                    'platform_id': platform_id,
                    'exporter_id': exporter_id,
                    'status': status_value,
                    'name': name,
                    'ip': ip,
                    'outip': outip,
                    'error': None
                }
            else:
                debug_print(f"[fetch_status] Нет данных или неверный формат JSON для MAC: {mac}")
                cached_info = get_cached_device_info(mac)
                debug_print(f"[fetch_status] Использую кэш: {cached_info}")
                return {
                    'mac': mac,
                    'platform_id': platform_id,
                    'exporter_id': exporter_id,
                    'status': 0,
                    'name': cached_info.get('name', 'unknown'),
                    'ip': cached_info.get('ip', 'unknown'),
                    'outip': cached_info.get('outip', 'unknown'),
                    'error': 'no_data'
                }
        except requests.exceptions.RequestException as e:
            debug_print(f"[fetch_status] Ошибка при запросе к API для MAC {mac}: {e}")
            cached_info = get_cached_device_info(mac)
            debug_print(f"[fetch_status] Использую кэш: {cached_info}")
            return {
                'mac': mac,
                'platform_id': platform_id,
                'exporter_id': exporter_id,
                'status': 0,
                'name': cached_info.get('name', 'unknown'),
                'ip': cached_info.get('ip', 'unknown'),
                'outip': cached_info.get('outip', 'unknown'),
                'error': str(e)
            }
        except Exception as e:
            debug_print(f"[fetch_status] Неожиданная ошибка для MAC {mac}: {e}")
            cached_info = get_cached_device_info(mac)
            debug_print(f"[fetch_status] Использую кэш: {cached_info}")
            return {
                'mac': mac,
                'platform_id': platform_id,
                'exporter_id': exporter_id,
                'status': 0,
                'name': cached_info.get('name', 'unknown'),
                'ip': cached_info.get('ip', 'unknown'),
                'outip': cached_info.get('outip', 'unknown'),
                'error': str(e)
            }

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_device = {executor.submit(debug_fetch_status, device): device for device in devices}
        for future in future_to_device:
            try:
                result = future.result()
                if result:
                    debug_print(f"Формирую метрику для MAC {result['mac']}: статус {result['status']}, name {result['name']}, ip {result['ip']}, outip {result['outip']}")
                    status_gauge.labels(
                        platform_id=result['platform_id'],
                        exporter_id=result['exporter_id'],
                        mac=result['mac']
                    ).set(result['status'])
                    info_gauge.labels(
                        platform_id=result['platform_id'],
                        exporter_id=result['exporter_id'],
                        mac=result['mac'],
                        name=result['name'],
                        ip=result['ip'],
                        outip=result['outip']
                    ).set(1)
            except Exception as e:
                debug_print(f"Ошибка обработки устройства: {e}")
    debug_print("Метрики сформированы, отдаю результат Prometheus")
    return Response(generate_latest(registry), mimetype='text/plain')

def debug_print(message):
    """Выводит сообщение только если включен DEBUG_MODE"""
    if DEBUG_MODE:
        print(message)

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(host='0.0.0.0', port=EXPORTER_PORT, debug=debug_mode) 