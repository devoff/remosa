import os
import requests
import sqlite3
from flask import Flask, Response
from prometheus_client import CollectorRegistry, Gauge, generate_latest
from dotenv import load_dotenv
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import logging
import json

# Настройка логирования: и в stdout, и в файл
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/tmp/addreality_exporter.log', mode='a', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()

ADDREALITY_API_URL = os.getenv('ADDREALITY_API_URL', 'https://api.ar.digital/public/v1/device/list')
REMOSA_API_URL = os.getenv('REMOSA_API_URL')
EXPORTER_PORT = int(os.getenv('EXPORTER_PORT', 9001))
DB_FILE = os.getenv('CACHE_DB_FILE', './addreality_cache.db')
DEBUG_MODE = os.getenv('DEBUG_MODE', '0') == '1'

# Максимальное количество параллельных запросов
MAX_WORKERS = 10

app = Flask(__name__)

# --- Кэширование в SQLite ---
def init_db():
    """Инициализация базы данных кэша"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS device_info (
            device_id TEXT PRIMARY KEY,
            name TEXT,
            connection_state TEXT,
            player_status TEXT,
            last_online TEXT,
            player_version TEXT,
            time_zone TEXT,
            activation_state TEXT,
            platform_id TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def cache_device_info(device_id, name, connection_state, player_status, last_online, 
                     player_version, time_zone, activation_state, platform_id):
    """Кэширование информации об устройстве"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO device_info 
        (device_id, name, connection_state, player_status, last_online, 
         player_version, time_zone, activation_state, platform_id, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (device_id, name, connection_state, player_status, last_online,
          player_version, time_zone, activation_state, platform_id, datetime.now()))
    conn.commit()
    conn.close()

def get_cached_device_info():
    """Получение кэшированной информации об устройствах"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM device_info')
    devices = cursor.fetchall()
    conn.close()
    return devices

# --- Prometheus метрики ---
registry = CollectorRegistry()

# Метрики для AddReality
connection_state_gauge = Gauge(
    'remosa_exporter_addreality_connection_state',
    'Connection status (1=online, 0=offline)',
    ['platform_id', 'device_id', 'name'],
    registry=registry
)

player_status_gauge = Gauge(
    'remosa_exporter_addreality_player_status',
    'Player status (1=playback, 0=pause)',
    ['platform_id', 'device_id', 'name'],
    registry=registry
)

last_online_gauge = Gauge(
    'remosa_exporter_addreality_last_online',
    'Last online timestamp',
    ['platform_id', 'device_id', 'name'],
    registry=registry
)

device_info_gauge = Gauge(
    'remosa_exporter_addreality_device_info',
    'Device information',
    ['platform_id', 'device_id', 'name', 'player_version', 'time_zone', 'activation_state'],
    registry=registry
)

# --- Получение платформ из REMOSA ---
def get_platform_configurations():
    """Получение конфигураций платформ с API ключами для AddReality"""
    try:
        if not REMOSA_API_URL:
            logger.error("REMOSA_API_URL не настроен")
            return []
        
        response = requests.get(f"{REMOSA_API_URL}/api/v1/platform-exporters?exporter_type=addreality", timeout=10)
        if response.status_code == 200:
            platforms = response.json()
            logger.info(f"Получено {len(platforms)} платформ с AddReality экспортерами")
            return platforms
        else:
            logger.error(f"Ошибка получения платформ: {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"Ошибка при получении платформ: {e}")
        return []

# --- Получение данных из AddReality API ---
def get_devices_from_addreality(api_token, platform_id):
    """Получение списка устройств из AddReality API"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'X-API-Token': api_token
        }
        
        payload = {
            "id": [],
            "limit": 300
        }
        
        response = requests.post(ADDREALITY_API_URL, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            devices = data.get('data', [])
            logger.info(f"Получено {len(devices)} устройств для платформы {platform_id}")
            return devices
        else:
            logger.error(f"Ошибка API AddReality для платформы {platform_id}: {response.status_code}")
            return []
            
    except Exception as e:
        logger.error(f"Ошибка при получении устройств для платформы {platform_id}: {e}")
        return []

# --- Обработка устройства ---
def process_device(device, platform_id):
    """Обработка одного устройства и экспорт метрик"""
    try:
        device_id = str(device.get('id', ''))
        name = device.get('name', '')
        connection_state = device.get('connection_state', '')
        player_status = device.get('player_status', '')
        last_online = device.get('last_online', '')
        player_version = device.get('player_version', '')
        time_zone = device.get('time_zone', '')
        activation_state = str(device.get('activation_state', False))
        
        # Преобразование значений для метрик
        connection_value = 1 if connection_state == 'online' else 0
        player_value = 1 if player_status == 'playback' else 0
        
        # Преобразование времени в Unix timestamp
        last_online_timestamp = 0
        if last_online:
            try:
                dt = datetime.fromisoformat(last_online.replace('Z', '+00:00'))
                last_online_timestamp = dt.timestamp()
            except:
                last_online_timestamp = 0
        
        # Экспорт метрик
        platform_id_str = str(platform_id)
        connection_state_gauge.labels(platform_id_str, device_id, name).set(connection_value)
        player_status_gauge.labels(platform_id_str, device_id, name).set(player_value)
        last_online_gauge.labels(platform_id_str, device_id, name).set(last_online_timestamp)
        device_info_gauge.labels(platform_id_str, device_id, name, player_version, time_zone, activation_state).set(1)
        
        # Кэширование
        cache_device_info(device_id, name, connection_state, player_status, last_online,
                         player_version, time_zone, activation_state, platform_id_str)
        
        logger.debug(f"Обработано устройство {device_id} ({name}) для платформы {platform_id}")
        
    except Exception as e:
        logger.error(f"Ошибка обработки устройства {device.get('id', 'unknown')}: {e}")

# --- Основная функция сбора метрик ---
def collect_metrics():
    """Сбор метрик со всех платформ"""
    try:
        logger.info("Начинаем сбор метрик AddReality")
        
        # Получение конфигураций платформ
        platforms = get_platform_configurations()
        
        if not platforms:
            logger.warning("Нет платформ с AddReality экспортерами")
            return
        
        # Обработка каждой платформы
        for platform_config in platforms:
            platform_id = platform_config.get('platform_id')
            configuration = platform_config.get('configuration', {})
            api_token = configuration.get('api_key')
            
            if not api_token:
                logger.warning(f"Нет API ключа для платформы {platform_id}")
                continue
            
            # Получение устройств для платформы
            devices = get_devices_from_addreality(api_token, platform_id)
            
            if not devices:
                logger.warning(f"Нет устройств для платформы {platform_id}")
                continue
            
            # Обработка устройств с использованием ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                futures = []
                for device in devices:
                    future = executor.submit(process_device, device, platform_id)
                    futures.append(future)
                
                # Ожидание завершения всех задач
                for future in futures:
                    future.result()
        
        logger.info("Сбор метрик AddReality завершен")
        
    except Exception as e:
        logger.error(f"Ошибка при сборе метрик: {e}")

# --- Flask маршруты ---
@app.route('/metrics')
def metrics():
    """Endpoint для Prometheus метрик"""
    try:
        # Сбор актуальных метрик
        collect_metrics()
        
        # Возврат метрик в формате Prometheus
        return Response(generate_latest(registry), mimetype='text/plain')
        
    except Exception as e:
        logger.error(f"Ошибка при генерации метрик: {e}")
        return Response("# Ошибка при генерации метрик\n", mimetype='text/plain')

@app.route('/health')
def health():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'AddRealityExporter'}

@app.route('/debug/platforms')
def debug_platforms():
    """Debug endpoint для просмотра платформ"""
    if not DEBUG_MODE:
        return {'error': 'Debug mode disabled'}, 404
    
    platforms = get_platform_configurations()
    return {'platforms': platforms}

@app.route('/debug/cache')
def debug_cache():
    """Debug endpoint для просмотра кэша"""
    if not DEBUG_MODE:
        return {'error': 'Debug mode disabled'}, 404
    
    devices = get_cached_device_info()
    return {'cached_devices': len(devices), 'devices': devices}

@app.route('/debug/test-addreality')
def test_addreality():
    """Debug endpoint для тестирования AddReality API с реальными данными"""
    if not DEBUG_MODE:
        return {'error': 'Debug mode disabled'}, 404
    
    try:
        # Тестовая конфигурация
        test_config = {
            'platform_id': 1,
            'api_token': 'XSHV-SF8X-EDB4-4V2K'  # Тестовый ключ
        }
        
        # Получаем данные из AddReality API
        devices = get_devices_from_addreality(test_config['api_token'], test_config['platform_id'])
        
        if not devices:
            return {'error': 'No devices received from AddReality API'}, 400
        
        # Обрабатываем ВСЕ устройства
        processed_devices = []
        for device in devices:
            # Обрабатываем устройство
            process_device(device, test_config['platform_id'])
            
            # Добавляем в результат только первые 5 для показа в ответе (но обрабатываем все)
            if len(processed_devices) < 5:
                processed_devices.append({
                    'device_id': str(device.get('id', '')),
                    'name': device.get('name', ''),
                    'connection_state': device.get('connection_state', ''),
                    'player_status': device.get('player_status', ''),
                    'last_online': device.get('last_online', ''),
                    'metrics_exported': True
                })
        
        return {
            'test_platform_id': test_config['platform_id'],
            'total_devices_received': len(devices),
            'processed_devices': processed_devices,
            'metrics_endpoint': '/metrics',
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Ошибка тестирования AddReality API: {e}")
        return {'error': str(e)}, 500

if __name__ == '__main__':
    logger.info("Запуск AddRealityExporter")
    logger.info(f"Порт: {EXPORTER_PORT}")
    logger.info(f"AddReality API URL: {ADDREALITY_API_URL}")
    logger.info(f"REMOSA API URL: {REMOSA_API_URL}")
    logger.info(f"Debug режим: {DEBUG_MODE}")
    
    # Инициализация базы данных
    init_db()
    
    # Запуск Flask приложения
    app.run(host='0.0.0.0', port=EXPORTER_PORT, debug=DEBUG_MODE)