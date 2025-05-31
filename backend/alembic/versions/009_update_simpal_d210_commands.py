"""update_simpal_d210_commands

Revision ID: 09_update_simpal_d210_commands
Revises: 008
Create Date: 2024-07-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("DELETE FROM command_templates WHERE model = 'SIMPAL_D210';")

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
            {
                'id': 1,
                'name': 'Регистрация номера администратора',
                'template': '#00#',
                'model': 'SIMPAL_D210',
                'category': 'Пользователи',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 2,
                'name': 'Добавление номера пользователя',
                'template': '#06#{phone}#',
                'model': 'SIMPAL_D210',
                'category': 'Пользователи',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'phone': {
                            'type': 'string',
                            'title': 'Номер пользователя',
                            'pattern': '^[+]?[0-9]{10,15}$'
                        }
                    },
                    'required': ['phone']
                }
            },
            {
                'id': 3,
                'name': 'Проверка добавленных номеров пользователей',
                'template': '#06#',
                'model': 'SIMPAL_D210',
                'category': 'Пользователи',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 4,
                'name': 'Удаление номера пользователя',
                'template': '#15#{phone}#',
                'model': 'SIMPAL_D210',
                'category': 'Пользователи',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'phone': {
                            'type': 'string',
                            'title': 'Номер пользователя',
                            'pattern': '^[+]?[0-9]{10,15}$'
                        }
                    },
                    'required': ['phone']
                }
            },
            {
                'id': 5,
                'name': 'Удаление всех номеров пользователей',
                'template': '#15#',
                'model': 'SIMPAL_D210',
                'category': 'Пользователи',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 6,
                'name': 'Включить функцию управления по звонку',
                'template': '#09#1#',
                'model': 'SIMPAL_D210',
                'category': 'Управление питанием',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 7,
                'name': 'Включить функцию управления по звонку на определенное время',
                'template': '#09#2#{time}#',
                'model': 'SIMPAL_D210',
                'category': 'Управление питанием',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'time': {
                            'type': 'integer',
                            'title': 'Время (минуты)'
                        }
                    },
                    'required': ['time']
                }
            },
            {
                'id': 8,
                'name': 'Выключить функцию управления по звонку',
                'template': '#09#0#',
                'model': 'SIMPAL_D210',
                'category': 'Управление питанием',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 9,
                'name': 'Включить питание',
                'template': '#01#0#',
                'model': 'SIMPAL_D210',
                'category': 'Управление питанием',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 10,
                'name': 'Выключить питание',
                'template': '#02#0#',
                'model': 'SIMPAL_D210',
                'category': 'Управление питанием',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 11,
                'name': 'Выключить питание на определенное время',
                'template': '#12#0#{minutes}#1#',
                'model': 'SIMPAL_D210',
                'category': 'Управление с задержкой',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'minutes': {
                            'type': 'integer',
                            'title': 'Минуты'
                        }
                    },
                    'required': ['minutes']
                }
            },
            {
                'id': 12,
                'name': 'Включить питание на определенное время',
                'template': '#12#0#{minutes}#0#',
                'model': 'SIMPAL_D210',
                'category': 'Управление с задержкой',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'minutes': {
                            'type': 'integer',
                            'title': 'Минуты'
                        }
                    },
                    'required': ['minutes']
                }
            },
            {
                'id': 13,
                'name': 'Включить функцию работы по расписанию',
                'template': '#19#0#1#',
                'model': 'SIMPAL_D210',
                'category': 'Управление по расписанию',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 14,
                'name': 'Настройка параметров работы по расписанию',
                'template': '#20#0#{day}#{start}#{stop}#',
                'model': 'SIMPAL_D210',
                'category': 'Управление по расписанию',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'day': {
                            'type': 'string',
                            'title': 'День недели (например, ПН, ВТ, ..., ВС)',
                            'enum': ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
                        },
                        'start': {
                            'type': 'string',
                            'title': 'Время начала (ЧЧ:ММ)',
                            'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
                        },
                        'stop': {
                            'type': 'string',
                            'title': 'Время окончания (ЧЧ:ММ)',
                            'pattern': '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
                        }
                    },
                    'required': ['day', 'start', 'stop']
                }
            },
            {
                'id': 15,
                'name': 'Включить функцию работы по температуре',
                'template': '#23#0#1#',
                'model': 'SIMPAL_D210',
                'category': 'Управление по температуре',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 16,
                'name': 'Настройка параметров работы по температуре',
                'template': '#24#0#{mode}#{lower_threshold}#{upper_threshold}#',
                'model': 'SIMPAL_D210',
                'category': 'Управление по температуре',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'mode': {
                            'type': 'integer',
                            'title': 'Режим (1-Нагрев, 2-Охлаждение)',
                            'enum': [1, 2]
                        },
                        'lower_threshold': {
                            'type': 'number',
                            'title': 'Нижний порог температуры'
                        },
                        'upper_threshold': {
                            'type': 'number',
                            'title': 'Верхний порог температуры'
                        }
                    },
                    'required': ['mode', 'lower_threshold', 'upper_threshold']
                }
            },
            {
                'id': 17,
                'name': 'Включить функцию оповещения по температуре',
                'template': '#21#0#1#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение по температуре',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 18,
                'name': 'Настройка диапазона температуры',
                'template': '#22#0#{lower_threshold}#{upper_threshold}#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение по температуре',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'lower_threshold': {
                            'type': 'number',
                            'title': 'Нижний порог температуры'
                        },
                        'upper_threshold': {
                            'type': 'number',
                            'title': 'Верхний порог температуры'
                        }
                    },
                    'required': ['lower_threshold', 'upper_threshold']
                }
            },
            {
                'id': 19,
                'name': 'Выключить функцию оповещения по температуре',
                'template': '#21#0#0#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение по температуре',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 20,
                'name': 'Включение функции оповещения о тревоге по датчикам',
                'template': '#40#1#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение о тревоге по датчикам',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 21,
                'name': 'Выключение функции оповещения о тревоге по датчикам',
                'template': '#40#0#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение о тревоге по датчикам',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 22,
                'name': 'Изменение имени датчиков',
                'template': '#43#{sensor1}#{sensor2}#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение о тревоге по датчикам',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'sensor1': {
                            'type': 'string',
                            'title': 'Имя датчика 1'
                        },
                        'sensor2': {
                            'type': 'string',
                            'title': 'Имя датчика 2'
                        }
                    },
                    'required': ['sensor1', 'sensor2']
                }
            },
            {
                'id': 23,
                'name': 'Изменение режима охранного входа',
                'template': '#44#{input_number}#{mode}#',
                'model': 'SIMPAL_D210',
                'category': 'Оповещение о тревоге по датчикам',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'input_number': {
                            'type': 'integer',
                            'title': 'Номер входа'
                        },
                        'mode': {
                            'type': 'integer',
                            'title': 'Режим'
                        }
                    },
                    'required': ['input_number', 'mode']
                }
            },
            {
                'id': 24,
                'name': 'Включить 220В по срабатыванию датчика',
                'template': '#42#220#{time}#',
                'model': 'SIMPAL_D210',
                'category': 'Автоматическое включение питания по датчику',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'time': {
                            'type': 'integer',
                            'title': 'Время (минуты)'
                        }
                    },
                    'required': ['time']
                }
            },
            {
                'id': 25,
                'name': 'Включить 12В по срабатыванию датчика',
                'template': '#42#12#{time}#',
                'model': 'SIMPAL_D210',
                'category': 'Автоматическое включение питания по датчику',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {
                        'time': {
                            'type': 'integer',
                            'title': 'Время (минуты)'
                        }
                    },
                    'required': ['time']
                }
            },
            {
                'id': 26,
                'name': 'Включить SMS оповещение при нажатии кнопки ручного управления',
                'template': '#03#1#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 27,
                'name': 'Выключить SMS оповещение при нажатии кнопки ручного управления',
                'template': '#03#0#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 28,
                'name': 'Включить функцию при потере питания',
                'template': '#05#1#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 29,
                'name': 'Выключить функцию при потере питания',
                'template': '#05#0#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 30,
                'name': 'Включить функцию при управлении звонком',
                'template': '#41#1#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 31,
                'name': 'Выключить функцию при управлении звонком',
                'template': '#41#0#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 32,
                'name': 'Включить функцию для доп. пользователей',
                'template': '#16#1#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 33,
                'name': 'Выключить функцию для доп. пользователей',
                'template': '#16#0#',
                'model': 'SIMPAL_D210',
                'category': 'SMS Оповещения',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 34,
                'name': 'Проверка общего статуса',
                'template': '#07#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 35,
                'name': 'Проверка статуса управления по задержке',
                'template': '#34#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 36,
                'name': 'Проверка статуса управления по расписанию',
                'template': '#33#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 37,
                'name': 'Проверка статуса управления по температуре',
                'template': '#32#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 38,
                'name': 'Проверка статуса оповещения по температуре',
                'template': '#35#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 39,
                'name': 'Проверка уровня GSM сигнала',
                'template': '#27#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 40,
                'name': 'Включить оповещение о низком уровне GSM сигнала',
                'template': '#27#1#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 41,
                'name': 'Выключить оповещение о низком уровне GSM сигнала',
                'template': '#27#0#',
                'model': 'SIMPAL_D210',
                'category': 'Проверка статуса устройства',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
            {
                'id': 42,
                'name': 'Сброс до заводских настроек',
                'template': '#08#1234#',
                'model': 'SIMPAL_D210',
                'category': 'Сброс на заводские настройки',
                'subcategory': None,
                'params_schema': {
                    'type': 'object',
                    'properties': {},
                    'required': []
                }
            },
        ]
    )


def downgrade():
    op.execute("DELETE FROM command_templates WHERE model = 'SIMPAL_D210';") 