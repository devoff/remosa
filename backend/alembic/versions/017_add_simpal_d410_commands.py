"""add_simpal_d410_commands

Revision ID: 017_add_simpal_d410_commands
Revises: 016_add_alert_type
Create Date: 2024-07-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '017_add_simpal_d410_commands'
down_revision = '016'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("DELETE FROM command_templates WHERE model = 'SIMPAL_D410';")

    op.bulk_insert(
        sa.Table(
            'command_templates',
            sa.MetaData(),
            sa.Column('id', sa.Integer, primary_key=True),
            sa.Column('name', sa.String),
            sa.Column('template', sa.String),
            sa.Column('model', sa.String),
            sa.Column('category', sa.String),
            sa.Column('subcategory', sa.String, nullable=True),
            sa.Column('params_schema', postgresql.JSONB),
        ),
        [
            # 1. Настройки телефонных номеров
            {'id': 41001, 'name': 'Зарегистрировать мастер-номер', 'template': '#00#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41002, 'name': 'Зарегистрировать номер пользователя (Уровень 1)', 'template': '#06#{phone}#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'phone': {'type': 'string', 'title': 'Номер пользователя', 'pattern': '^[+]?[0-9]{10,15}$'}}, 'required': ['phone']}},
            {'id': 41003, 'name': 'Зарегистрировать номера пользователей (Уровень 2)', 'template': '#60#{phones}#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'phones': {'type': 'string', 'title': 'Список номеров через #', 'pattern': '^([+]?[0-9]{10,15}#?){1,10}$'}}, 'required': ['phones']}},
            {'id': 41004, 'name': 'Проверить зарегистрированные номера', 'template': '#06#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41005, 'name': 'Включить режим обучения (60 минут)', 'template': '#06#1#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41006, 'name': 'Постоянный режим обучения', 'template': '#06#2#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41007, 'name': 'Отключить режим обучения', 'template': '#06#0#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41008, 'name': 'Удалить номер пользователя', 'template': '#15#{phone}#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'phone': {'type': 'string', 'title': 'Номер пользователя', 'pattern': '^[+]?[0-9]{10,15}$'}}, 'required': ['phone']}},
            {'id': 41009, 'name': 'Удалить все номера пользователей', 'template': '#15#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41010, 'name': 'Разрешить вызов с любого номера – ВКЛ', 'template': '#31#1#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41011, 'name': 'Запретить вызов с любого номера (по умолчанию)', 'template': '#31#0#', 'model': 'SIMPAL_D410', 'category': 'Настройки номеров', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},

            # 2. Управление питанием по звонку
            {'id': 41012, 'name': 'Включить питание обеих линий на время', 'template': '#10#0#{time}#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41013, 'name': 'Включить питание Линии 1 на время', 'template': '#10#1#{time}#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41014, 'name': 'Включить питание Линии 2 на время', 'template': '#10#2#{time}#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41015, 'name': 'Отключить управление обеими линиями', 'template': '#10#0#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41016, 'name': 'Отключить управление Линией 1', 'template': '#10#1#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41017, 'name': 'Отключить управление Линией 2', 'template': '#10#2#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41018, 'name': 'Проверить настройки управления', 'template': '#10#', 'model': 'SIMPAL_D410', 'category': 'Управление питанием', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},

            # 3. Управление питанием через SMS
            {'id': 41019, 'name': 'Включить обе линии', 'template': '#01#', 'model': 'SIMPAL_D410', 'category': 'Включение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41020, 'name': 'Включить Линию 1', 'template': '#01#1#', 'model': 'SIMPAL_D410', 'category': 'Включение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41021, 'name': 'Включить Линию 2', 'template': '#01#2#', 'model': 'SIMPAL_D410', 'category': 'Включение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41022, 'name': 'Выключить обе линии', 'template': '#02#', 'model': 'SIMPAL_D410', 'category': 'Выключение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41023, 'name': 'Выключить Линию 1', 'template': '#02#1#', 'model': 'SIMPAL_D410', 'category': 'Выключение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41024, 'name': 'Выключить Линию 2', 'template': '#02#2#', 'model': 'SIMPAL_D410', 'category': 'Выключение питания', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41025, 'name': 'Включить обе линии через N минут', 'template': '#11#0#1#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41026, 'name': 'Включить Линию 1 через N минут', 'template': '#11#1#1#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41027, 'name': 'Включить Линию 2 через N минут', 'template': '#11#2#1#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41028, 'name': 'Выключить обе линии через N минут', 'template': '#11#0#2#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41029, 'name': 'Выключить Линию 1 через N минут', 'template': '#11#1#2#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41030, 'name': 'Выключить Линию 2 через N минут', 'template': '#11#2#2#{minutes}#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'minutes': {'type': 'integer', 'title': 'Минуты'}}, 'required': ['minutes']}},
            {'id': 41031, 'name': 'Отключить задержку (по умолчанию)', 'template': '#11#0#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41032, 'name': 'Проверить настройки задержки', 'template': '#11#', 'model': 'SIMPAL_D410', 'category': 'Задержка', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},

            # 4. Управление по расписанию
            {'id': 41033, 'name': 'Включить расписание для обеих линий', 'template': '#20#0#{day}#{start}#{end}#', 'model': 'SIMPAL_D410', 'category': 'Расписание', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'day': {'type': 'string', 'title': 'День недели'}, 'start': {'type': 'string', 'title': 'Время начала', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}, 'end': {'type': 'string', 'title': 'Время окончания', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}}, 'required': ['day', 'start', 'end']}},
            {'id': 41034, 'name': 'Включить расписание для Линии 1', 'template': '#20#1#{day}#{start}#{end}#', 'model': 'SIMPAL_D410', 'category': 'Расписание', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'day': {'type': 'string', 'title': 'День недели'}, 'start': {'type': 'string', 'title': 'Время начала', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}, 'end': {'type': 'string', 'title': 'Время окончания', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}}, 'required': ['day', 'start', 'end']}},
            {'id': 41035, 'name': 'Включить расписание для Линии 2', 'template': '#20#2#{day}#{start}#{end}#', 'model': 'SIMPAL_D410', 'category': 'Расписание', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'day': {'type': 'string', 'title': 'День недели'}, 'start': {'type': 'string', 'title': 'Время начала', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}, 'end': {'type': 'string', 'title': 'Время окончания', 'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'}}, 'required': ['day', 'start', 'end']}},
            {'id': 41036, 'name': 'Отключить расписание (по умолчанию)', 'template': '#20#0#', 'model': 'SIMPAL_D410', 'category': 'Расписание', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41037, 'name': 'Проверить настройки расписания', 'template': '#20#', 'model': 'SIMPAL_D410', 'category': 'Расписание', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},

            # 5. Термостат и температурная сигнализация
            {'id': 41038, 'name': 'Включить термостат для обеих линий', 'template': '#24#0#{mode}#{min_temp}#{max_temp}#', 'model': 'SIMPAL_D410', 'category': 'Термостат', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'mode': {'type': 'integer', 'title': 'Режим'}, 'min_temp': {'type': 'number', 'title': 'Мин. температура'}, 'max_temp': {'type': 'number', 'title': 'Макс. температура'}}, 'required': ['mode', 'min_temp', 'max_temp']}},
            {'id': 41039, 'name': 'Включить термостат для Линии 1', 'template': '#24#1#{mode}#{min_temp}#{max_temp}#', 'model': 'SIMPAL_D410', 'category': 'Термостат', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'mode': {'type': 'integer', 'title': 'Режим'}, 'min_temp': {'type': 'number', 'title': 'Мин. температура'}, 'max_temp': {'type': 'number', 'title': 'Макс. температура'}}, 'required': ['mode', 'min_temp', 'max_temp']}},
            {'id': 41040, 'name': 'Включить термостат для Линии 2', 'template': '#24#2#{mode}#{min_temp}#{max_temp}#', 'model': 'SIMPAL_D410', 'category': 'Термостат', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'mode': {'type': 'integer', 'title': 'Режим'}, 'min_temp': {'type': 'number', 'title': 'Мин. температура'}, 'max_temp': {'type': 'number', 'title': 'Макс. температура'}}, 'required': ['mode', 'min_temp', 'max_temp']}},
            {'id': 41041, 'name': 'Отключить термостат (по умолчанию)', 'template': '#24#0#', 'model': 'SIMPAL_D410', 'category': 'Термостат', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41042, 'name': 'Проверить настройки термостата', 'template': '#24#', 'model': 'SIMPAL_D410', 'category': 'Термостат', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41043, 'name': 'Установить диапазон температуры', 'template': '#22#{min_temp}#{max_temp}#', 'model': 'SIMPAL_D410', 'category': 'Температурная сигнализация', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'min_temp': {'type': 'number', 'title': 'Мин. температура'}, 'max_temp': {'type': 'number', 'title': 'Макс. температура'}}, 'required': ['min_temp', 'max_temp']}},
            {'id': 41044, 'name': 'Включить сигнализацию температуры', 'template': '#22#1#', 'model': 'SIMPAL_D410', 'category': 'Температурная сигнализация', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41045, 'name': 'Отключить сигнализацию (по умолчанию)', 'template': '#22#0#', 'model': 'SIMPAL_D410', 'category': 'Температурная сигнализация', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},

            # 6. Датчики и уведомления
            {'id': 41046, 'name': 'Включить питание при срабатывании датчика (обе линии)', 'template': '#09#0#{time}#', 'model': 'SIMPAL_D410', 'category': 'Датчики', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41047, 'name': 'Включить Линию 1 при срабатывании датчика', 'template': '#09#1#{time}#', 'model': 'SIMPAL_D410', 'category': 'Датчики', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41048, 'name': 'Включить Линию 2 при срабатывании датчика', 'template': '#09#2#{time}#', 'model': 'SIMPAL_D410', 'category': 'Датчики', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {'time': {'type': 'integer', 'title': 'Время (минуты)'}}, 'required': ['time']}},
            {'id': 41049, 'name': 'Отключить управление датчиком (по умолчанию)', 'template': '#09#0#', 'model': 'SIMPAL_D410', 'category': 'Датчики', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41050, 'name': 'Проверить настройки датчиков', 'template': '#09#', 'model': 'SIMPAL_D410', 'category': 'Датчики', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41051, 'name': 'Уведомление при отключении питания – ВКЛ (по умолчанию)', 'template': '#05#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41052, 'name': 'Уведомление при отключении питания – ВЫКЛ', 'template': '#05#0#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41053, 'name': 'Уведомление при срабатывании датчика – ВКЛ (по умолчанию)', 'template': '#17#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41054, 'name': 'Уведомление при срабатывании датчика – ВЫКЛ', 'template': '#17#0#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41055, 'name': 'Сигнализация при открытии/закрытии датчика', 'template': '#44#3#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41056, 'name': 'Сигнализация только при закрытии датчика', 'template': '#44#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41057, 'name': 'Сигнализация только при открытии датчика', 'template': '#44#2#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41058, 'name': 'Проверить статус датчика', 'template': '#44#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41059, 'name': 'Уведомление о слабом GSM-сигнале – ВКЛ', 'template': '#27#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41060, 'name': 'Уведомление о слабом GSM-сигнале – ВЫКЛ (по умолчанию)', 'template': '#27#0#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41061, 'name': 'Проверить уровень GSM-сигнала', 'template': '#27#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41062, 'name': 'Уведомление о звонке – ВКЛ', 'template': '#32#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41063, 'name': 'Уведомление о звонке – ВЫКЛ (по умолчанию)', 'template': '#32#0#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41064, 'name': 'Уведомлять пользователя – ВКЛ (по умолчанию)', 'template': '#12#1#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41065, 'name': 'Уведомлять пользователя – ВЫКЛ', 'template': '#12#0#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41066, 'name': 'Проверить статус устройства', 'template': '#07#', 'model': 'SIMPAL_D410', 'category': 'SMS-уведомления', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
            {'id': 41067, 'name': 'Сброс к заводским настройкам', 'template': '#08#1234#', 'model': 'SIMPAL_D410', 'category': 'Сброс', 'subcategory': None, 'params_schema': {'type': 'object', 'properties': {}, 'required': []}},
        ]
    )

def downgrade():
    op.execute("DELETE FROM command_templates WHERE model = 'SIMPAL_D410';") 