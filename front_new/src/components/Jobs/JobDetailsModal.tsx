import React from 'react';
import { X, AlertTriangle, Bell, Terminal, Globe, Clock, CheckCircle, Pause } from 'lucide-react';
import { Job } from '../../types/exporter';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ 
  job, 
  onClose 
}) => {
  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'alert':
        return <AlertTriangle className="text-red-400" size={20} />;
      case 'notification':
        return <Bell className="text-blue-400" size={20} />;
      case 'command':
        return <Terminal className="text-green-400" size={20} />;
      default:
        return <Globe className="text-gray-400" size={20} />;
    }
  };

  const getJobTypeText = (jobType: string) => {
    switch (jobType) {
      case 'alert':
        return 'Алерт';
      case 'notification':
        return 'Уведомление';
      case 'command':
        return 'Команда';
      default:
        return 'Неизвестно';
    }
  };

  const getOperatorText = (operator: string) => {
    switch (operator) {
      case 'equals':
        return 'Равно';
      case 'not_equals':
        return 'Не равно';
      case 'contains':
        return 'Содержит';
      case 'greater_than':
        return 'Больше';
      case 'less_than':
        return 'Меньше';
      default:
        return operator;
    }
  };

  const getActionTypeText = (type: string) => {
    switch (type) {
      case 'send_notification':
        return 'Отправить уведомление';
      case 'execute_command':
        return 'Выполнить команду';
      case 'webhook':
        return 'Webhook';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">
              Детали задания: {job.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                  {getJobTypeIcon(job.job_type)}
                  <span className="ml-2">Основная информация</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Название</p>
                    <p className="text-gray-100 font-medium">{job.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Тип</p>
                    <p className="text-gray-100 font-medium">{getJobTypeText(job.job_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Статус</p>
                    <div className="flex items-center">
                      {job.is_active ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : (
                        <Pause className="text-gray-500" size={16} />
                      )}
                      <span className={`ml-2 font-medium ${
                        job.is_active ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {job.is_active ? 'Активно' : 'Неактивно'}
                      </span>
                    </div>
                  </div>
                  {job.description && (
                    <div>
                      <p className="text-sm text-gray-400">Описание</p>
                      <p className="text-gray-100">{job.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                  <Clock className="text-yellow-400" size={20} />
                  <span className="ml-2">Статистика</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Выполнений</p>
                    <p className="text-2xl font-bold text-gray-100">{job.execution_count}</p>
                  </div>
                  {job.last_executed_at && (
                    <div>
                      <p className="text-sm text-gray-400">Последнее выполнение</p>
                      <p className="text-gray-100">{formatDate(job.last_executed_at)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Создано</p>
                    <p className="text-gray-100">{formatDate(job.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Обновлено</p>
                    <p className="text-gray-100">{formatDate(job.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Условия */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                <AlertTriangle className="text-orange-400" size={20} />
                <span className="ml-2">Условия ({job.conditions.length})</span>
              </h3>
              
              {job.conditions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Нет условий</p>
              ) : (
                <div className="space-y-3">
                  {job.conditions.map((condition, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Условие {index + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Поле</p>
                          <p className="text-gray-100 font-mono">{condition.field}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Оператор</p>
                          <p className="text-gray-100">{getOperatorText(condition.operator)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Значение</p>
                          <p className="text-gray-100 font-mono">{condition.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Действия */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                <Terminal className="text-green-400" size={20} />
                <span className="ml-2">Действия ({job.actions.length})</span>
              </h3>
              
              {job.actions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Нет действий</p>
              ) : (
                <div className="space-y-3">
                  {job.actions.map((action, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Действие {index + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-400 text-sm">Тип</p>
                          <p className="text-gray-100">{getActionTypeText(action.type)}</p>
                        </div>
                        
                        {action.type === 'send_notification' && action.config.message && (
                          <div>
                            <p className="text-gray-400 text-sm">Сообщение</p>
                            <p className="text-gray-100 bg-gray-800 p-2 rounded text-sm">
                              {action.config.message}
                            </p>
                          </div>
                        )}
                        
                        {action.type === 'execute_command' && action.config.command_template_id && (
                          <div>
                            <p className="text-gray-400 text-sm">ID шаблона команды</p>
                            <p className="text-gray-100 font-mono">{action.config.command_template_id}</p>
                          </div>
                        )}
                        
                        {action.type === 'webhook' && action.config.webhook_url && (
                          <div>
                            <p className="text-gray-400 text-sm">Webhook URL</p>
                            <p className="text-gray-100 font-mono text-sm break-all">
                              {action.config.webhook_url}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal; 