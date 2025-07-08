import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Bell, Terminal, Globe, Clock, CheckCircle, Pause, Edit2, Save } from 'lucide-react';
import { Job, JobExecution, JobCondition, JobAction } from '../../types/exporter';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { useExporterApi } from '../../lib/exporterApi';
import { useNotification } from '../NotificationProvider';
import {
  PrometheusDeviceSelector,
  MetricSelector,
  OperatorSelector,
  ThresholdInput,
  ManagementDeviceSelector,
  CommandTemplateSelector,
  ActionTypeSelector,
  ActionParametersInput
} from './JobEditors';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ 
  job, 
  onClose 
}) => {
  const [editBlock, setEditBlock] = useState<null | 'main' | 'conditions' | 'actions'>(null);
  const [editData, setEditData] = useState<Job>(job);
  const { updateJob, getJobExecutions } = useExporterApi();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [execLoading, setExecLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSaveBlock = async (block: 'main' | 'conditions' | 'actions') => {
    setLoading(true);
    setErrors({});
    try {
      let patch: Partial<Job> = {};
      if (block === 'main') {
        patch = {
          name: editData.name,
          description: editData.description,
          is_active: editData.is_active,
        };
      } else if (block === 'conditions') {
        // Валидация условий
        const newErrors: Record<string, string> = {};
        if (!editData.monitoring_device_mac) {
          newErrors.monitoring_device_mac = 'Выберите устройство для мониторинга';
        }
        if (!editData.monitoring_metric) {
          newErrors.monitoring_metric = 'Выберите метрику';
        }
        if (!editData.operator) {
          newErrors.operator = 'Выберите оператор';
        }
        if (!editData.threshold_value) {
          newErrors.threshold_value = 'Введите пороговое значение';
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setLoading(false);
          return;
        }
        // Сохраняем все ключевые поля, чтобы не терялись значения
        patch = {
          name: editData.name,
          description: editData.description,
          is_active: editData.is_active,
          monitoring_device_mac: editData.monitoring_device_mac,
          monitoring_metric: editData.monitoring_metric,
          operator: (editData.operator as JobCondition['operator']) ?? 'equals',
          threshold_value: editData.threshold_value,
          // Обновляем условия с информацией о метрике
          conditions: [{
            field: editData.monitoring_metric ?? '',
            operator: (editData.operator as JobCondition['operator']) ?? 'equals',
            value: editData.threshold_value ?? '',
            monitoring_device_mac: editData.monitoring_device_mac ?? '',
            monitoring_metric: editData.monitoring_metric ?? '',
            metric_human_name: editData.conditions?.[0]?.metric_human_name ?? '',
            metric_unit: editData.conditions?.[0]?.metric_unit ?? '',
            metric_description: editData.conditions?.[0]?.metric_description ?? '',
          }],
        };
      } else if (block === 'actions') {
        // Валидация действий
        const newErrors: Record<string, string> = {};
        if (!editData.device_id) {
          newErrors.device_id = 'Выберите устройство для управления';
        }
        if (!editData.actions[0]?.type) {
          newErrors.action_type = 'Выберите тип действия';
        }
        if (!editData.command && !editData.actions[0]?.config?.message) {
          newErrors.action_parameters = 'Введите параметры действия';
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setLoading(false);
          return;
        }
        // Сохраняем все ключевые поля, чтобы не терялись значения
        patch = {
          name: editData.name,
          description: editData.description,
          is_active: editData.is_active,
          monitoring_device_mac: editData.monitoring_device_mac,
          monitoring_metric: editData.monitoring_metric,
          operator: (editData.operator as JobCondition['operator']) ?? 'equals',
          threshold_value: editData.threshold_value,
          device_id: editData.device_id,
          command: editData.command,
          command_template_id: editData.command_template_id,
          // Обновляем действия с информацией о командах
          actions: editData.actions.map(action => ({
            ...action,
            config: {
              ...action.config,
              // Эти поля будут заполнены при выборе команды
              command_template_name: action.config?.command_template_name,
              command_template_category: action.config?.command_template_category,
              command_template_subcategory: action.config?.command_template_subcategory,
              command_parameters: action.config?.command_parameters,
              final_command: action.config?.final_command,
            }
          })),
        };
      }
      const updated = await updateJob(job.id, patch);
      notify('Изменения сохранены', 'success');
      setEditBlock(null);
      setErrors({});
      setEditData(updated); // Синхронизируем editData с ответом API
    } catch (e) {
      notify('Ошибка при сохранении', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setExecLoading(true);
    getJobExecutions(job.id)
      .then(setExecutions)
      .finally(() => setExecLoading(false));
  }, [job.id]);

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
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700 relative">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                {getJobTypeIcon(job.job_type)}
                <span className="ml-2">Основная информация</span>
                <button className="ml-auto text-gray-400 hover:text-blue-400" onClick={() => { setEditBlock('main'); setEditData(job); }} title="Редактировать">
                  <Edit2 size={18} />
                </button>
              </h3>
              {editBlock === 'main' ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Название</p>
                    <Input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Тип</p>
                    <p className="text-gray-100 font-medium">{getJobTypeText(job.job_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Статус</p>
                    <Select value={editData.is_active ? 'true' : 'false'} onValueChange={v => setEditData(d => ({ ...d, is_active: v === 'true' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Активно</SelectItem>
                        <SelectItem value="false">Неактивно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Описание</p>
                    <Input value={editData.description || ''} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleSaveBlock('main')} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
                    <Button variant="outline" onClick={() => setEditBlock(null)}>Отмена</Button>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

            {/* Условия */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700 relative">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                <AlertTriangle className="text-orange-400" size={20} />
                <span className="ml-2">Условия ({job.conditions.length})</span>
                <button className="ml-auto text-gray-400 hover:text-blue-400" onClick={() => { setEditBlock('conditions'); setEditData(job); }} title="Редактировать"><Edit2 size={18} /></button>
              </h3>
              
              {editBlock === 'conditions' ? (
                <div className="space-y-6">
                  <PrometheusDeviceSelector
                    value={editData.monitoring_device_mac || ''}
                    onChange={(value) => setEditData(d => ({ ...d, monitoring_device_mac: value }))}
                    error={errors.monitoring_device_mac}
                  />
                  
                  <MetricSelector
                    deviceMac={editData.monitoring_device_mac || ''}
                    value={editData.monitoring_metric || ''}
                    onChange={(value) => setEditData(d => ({ ...d, monitoring_metric: value }))}
                    error={errors.monitoring_metric}
                    onMetricSelect={(metric) => {
                      // Обновляем условия с информацией о выбранной метрике
                      const newConditions: JobCondition[] = [{
                        field: metric.technical_name,
                        operator: (editData.operator as JobCondition['operator']) ?? 'equals',
                        value: editData.threshold_value || '',
                        monitoring_device_mac: editData.monitoring_device_mac,
                        monitoring_metric: metric.technical_name,
                        metric_human_name: metric.human_name,
                        metric_unit: metric.unit,
                        metric_description: metric.description,
                      }];
                      setEditData(d => ({ 
                        ...d, 
                        monitoring_metric: metric.technical_name,
                        conditions: newConditions
                      }));
                    }}
                  />
                  
                  <OperatorSelector
                    value={editData.operator || ''}
                    onChange={(value) => setEditData(d => ({ ...d, operator: value }))}
                    error={errors.operator}
                  />
                  
                  <ThresholdInput
                    value={editData.threshold_value || ''}
                    onChange={(value) => setEditData(d => ({ ...d, threshold_value: value }))}
                    error={errors.threshold_value}
                    metric={editData.monitoring_metric}
                    operator={editData.operator}
                  />
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleSaveBlock('conditions')} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
                    <Button variant="outline" onClick={() => setEditBlock(null)}>Отмена</Button>
                  </div>
                </div>
              ) : (
                !job.monitoring_device_mac ? (
                  <p className="text-gray-400 text-center py-4">Нет настроенных условий мониторинга</p>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Условие мониторинга</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Устройство</p>
                          <p className="text-gray-100 font-mono">{job.monitoring_device_mac}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Метрика</p>
                          <p className="text-gray-100">
                            {job.monitoring_metric}
                            {job.conditions[0]?.metric_human_name && (
                              <span className="text-xs text-gray-400 block">
                                {job.conditions[0].metric_human_name}
                              </span>
                            )}
                            {job.conditions[0]?.metric_unit && (
                              <span className="text-xs text-gray-400 block">
                                Единица: {job.conditions[0].metric_unit}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Оператор</p>
                          <p className="text-gray-100">{job.operator}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Пороговое значение</p>
                          <p className="text-gray-100 font-mono">{job.threshold_value}</p>
                        </div>
                      </div>
                      {job.conditions[0]?.metric_description && (
                        <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                          <p className="text-gray-300">{job.conditions[0].metric_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Действия */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700 relative">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                <Terminal className="text-green-400" size={20} />
                <span className="ml-2">Действия ({job.actions.length})</span>
                <button className="ml-auto text-gray-400 hover:text-blue-400" onClick={() => { setEditBlock('actions'); setEditData(job); }} title="Редактировать"><Edit2 size={18} /></button>
              </h3>
              
              {editBlock === 'actions' ? (
                <div className="space-y-6">
                  <ActionTypeSelector
                    value={editData.actions[0]?.type || 'send_notification'}
                    onChange={(value) => {
                      const newActions: JobAction[] = [{ type: value as JobAction['type'], config: {} }];
                      setEditData(d => ({ ...d, actions: newActions }));
                    }}
                    error={errors.action_type}
                  />
                  
                  <ManagementDeviceSelector
                    value={editData.device_id}
                    onChange={(value) => setEditData(d => ({ ...d, device_id: value }))}
                    error={errors.device_id}
                  />
                  
                  {editData.actions[0]?.type === 'execute_command' && (
                    <CommandTemplateSelector
                      deviceId={editData.device_id}
                      value={editData.command_template_id}
                      onChange={(value) => setEditData(d => ({ ...d, command_template_id: value }))}
                      error={errors.command_template_id}
                      onCommandSelect={(template, parameters, finalCommand) => {
                        // Обновляем действия с информацией о выбранной команде
                        const newActions: JobAction[] = [{
                          type: 'execute_command',
                          config: {
                            command_template_id: template.id,
                            command_template_name: template.name,
                            command_template_category: template.category,
                            command_template_subcategory: template.subcategory,
                            command_parameters: parameters,
                            final_command: finalCommand,
                          }
                        }];
                        setEditData(d => ({ 
                          ...d, 
                          command_template_id: template.id,
                          command: finalCommand,
                          actions: newActions
                        }));
                      }}
                    />
                  )}
                  
                  <ActionParametersInput
                    actionType={editData.actions[0]?.type || 'send_notification'}
                    value={editData.actions[0]?.config?.message || editData.command || ''}
                    onChange={(value) => {
                      const newActions = [...editData.actions];
                      if (newActions[0]) {
                        newActions[0].config = { ...newActions[0].config, message: value };
                      }
                      setEditData(d => ({ 
                        ...d, 
                        actions: newActions,
                        command: value 
                      }));
                    }}
                    error={errors.action_parameters}
                  />
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleSaveBlock('actions')} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
                    <Button variant="outline" onClick={() => setEditBlock(null)}>Отмена</Button>
                  </div>
                </div>
              ) : (
                !job.device_id ? (
                  <p className="text-gray-400 text-center py-4">Нет настроенных действий</p>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Действие управления</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400">Устройство управления</p>
                          <p className="text-gray-100 font-mono">ID: {job.device_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Тип действия</p>
                          <p className="text-gray-100">{getActionTypeText(job.actions[0]?.type || 'send_notification')}</p>
                        </div>
                        {job.actions[0]?.config?.command_template_name && (
                          <div>
                            <p className="text-gray-400">Шаблон команды</p>
                            <p className="text-gray-100">
                              {job.actions[0].config.command_template_name}
                              {job.actions[0].config.command_template_category && (
                                <span className="text-xs text-gray-400 block">
                                  {job.actions[0].config.command_template_category}
                                  {job.actions[0].config.command_template_subcategory && (
                                    <span> • {job.actions[0].config.command_template_subcategory}</span>
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {job.actions[0]?.config?.final_command && (
                          <div>
                            <p className="text-gray-400">Итоговая команда</p>
                            <p className="text-gray-100 font-mono bg-gray-800 p-2 rounded text-sm break-all">
                              {job.actions[0].config.final_command}
                            </p>
                          </div>
                        )}
                        {job.actions[0]?.config?.command_parameters && Object.keys(job.actions[0].config.command_parameters).length > 0 && (
                          <div>
                            <p className="text-gray-400">Параметры команды</p>
                            <div className="bg-gray-800 p-2 rounded text-xs">
                              {Object.entries(job.actions[0].config.command_parameters).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-400">{key}:</span>
                                  <span className="text-gray-100">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {job.command && !job.actions[0]?.config?.final_command && (
                          <div>
                            <p className="text-gray-400">Команда</p>
                            <p className="text-gray-100 font-mono">{job.command}</p>
                          </div>
                        )}
                        {job.command_template_id && !job.actions[0]?.config?.command_template_name && (
                          <div>
                            <p className="text-gray-400">Шаблон команды</p>
                            <p className="text-gray-100 font-mono">ID: {job.command_template_id}</p>
                          </div>
                        )}
                        {job.actions[0]?.config?.message && (
                          <div>
                            <p className="text-gray-400">Сообщение</p>
                            <p className="text-gray-100 bg-gray-800 p-2 rounded text-sm">
                              {job.actions[0].config.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* История срабатываний */}
            <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                <Clock className="text-yellow-400" size={20} />
                <span className="ml-2">История срабатываний</span>
              </h3>
              {execLoading ? (
                <p className="text-gray-400">Загрузка...</p>
              ) : executions.length === 0 ? (
                <p className="text-gray-400">Нет срабатываний</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="px-2 py-1 text-left">Дата</th>
                        <th className="px-2 py-1 text-left">Статус</th>
                        <th className="px-2 py-1 text-left">Результат</th>
                        <th className="px-2 py-1 text-left">Ошибка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.map(exec => (
                        <tr key={exec.id} className="border-b border-gray-700">
                          <td className="px-2 py-1">{formatDate(exec.created_at)}</td>
                          <td className="px-2 py-1">
                            <span className={
                              exec.status === 'completed' && exec.success ? 'text-green-400' :
                              exec.status === 'failed' || exec.success === false ? 'text-red-400' :
                              'text-gray-300'
                            }>
                              {exec.status}
                            </span>
                          </td>
                          <td className="px-2 py-1">{exec.prometheus_value || exec.output || '-'}</td>
                          <td className="px-2 py-1 text-red-400">{exec.error_message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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