import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../../lib/exporterApi';
import { JobFormData, Job, JobCondition, JobAction } from '../../types/exporter';
import { useNotification } from '../NotificationProvider';

interface JobDialogProps {
  job?: Job;
  onClose: () => void;
  onSave: () => void;
}

const JobDialog: React.FC<JobDialogProps> = ({ 
  job, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<JobFormData>({
    name: '',
    description: '',
    job_type: 'alert',
    conditions: [],
    actions: [],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createJob, updateJob } = useExporterApi();
  const { notify } = useNotification();

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name,
        description: job.description || '',
        job_type: job.job_type,
        conditions: job.conditions,
        actions: job.actions,
        is_active: job.is_active
      });
    }
  }, [job]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название обязательно';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'Добавьте хотя бы одно условие';
    }

    if (formData.actions.length === 0) {
      newErrors.actions = 'Добавьте хотя бы одно действие';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (job) {
        await updateJob(job.id, formData);
        notify('Задание обновлено', 'success');
      } else {
        await createJob(formData);
        notify('Задание создано', 'success');
      }
      
      onSave();
    } catch (error) {
      notify('Ошибка при сохранении', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    const newCondition: JobCondition = {
      field: '',
      operator: 'equals',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (index: number, field: keyof JobCondition, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    const newAction: JobAction = {
      type: 'send_notification',
      config: {}
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (index: number, field: keyof JobAction, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const updateActionConfig = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { 
          ...action, 
          config: { ...action.config, [field]: value } 
        } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">
              {job ? 'Редактировать задание' : 'Создать задание'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название задания *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${
                    errors.name ? 'border-red-500' : 'border-gray-600'
                  } focus:border-blue-500 focus:outline-none`}
                  placeholder="Введите название задания"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Тип задания *
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    job_type: e.target.value as 'alert' | 'command' | 'notification' 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="alert">Алерт</option>
                  <option value="notification">Уведомление</option>
                  <option value="command">Команда</option>
                </select>
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Описание задания"
              />
            </div>

            {/* Условия */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Условия *
                </label>
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  Добавить условие
                </button>
              </div>
              
              {formData.conditions.length === 0 ? (
                <p className="text-gray-400 text-sm">Нет условий</p>
              ) : (
                <div className="space-y-3">
                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="bg-gray-750 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Условие {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Поле</label>
                          <input
                            type="text"
                            value={condition.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="device_status"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Оператор</label>
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value as any)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="equals">Равно</option>
                            <option value="not_equals">Не равно</option>
                            <option value="contains">Содержит</option>
                            <option value="greater_than">Больше</option>
                            <option value="less_than">Меньше</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Значение</label>
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="offline"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.conditions && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.conditions}
                </p>
              )}
            </div>

            {/* Действия */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Действия *
                </label>
                <button
                  type="button"
                  onClick={addAction}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} />
                  Добавить действие
                </button>
              </div>
              
              {formData.actions.length === 0 ? (
                <p className="text-gray-400 text-sm">Нет действий</p>
              ) : (
                <div className="space-y-3">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="bg-gray-750 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Действие {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Тип действия</label>
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, 'type', e.target.value as any)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="send_notification">Отправить уведомление</option>
                            <option value="execute_command">Выполнить команду</option>
                            <option value="webhook">Webhook</option>
                          </select>
                        </div>
                        
                        {action.type === 'send_notification' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Сообщение</label>
                            <textarea
                              value={action.config.message || ''}
                              onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                              rows={2}
                              placeholder="Текст уведомления"
                            />
                          </div>
                        )}
                        
                        {action.type === 'execute_command' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">ID шаблона команды</label>
                            <input
                              type="number"
                              value={action.config.command_template_id || ''}
                              onChange={(e) => updateActionConfig(index, 'command_template_id', parseInt(e.target.value))}
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="1"
                            />
                          </div>
                        )}
                        
                        {action.type === 'webhook' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">URL</label>
                            <input
                              type="url"
                              value={action.config.webhook_url || ''}
                              onChange={(e) => updateActionConfig(index, 'webhook_url', e.target.value)}
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="https://webhook.example.com"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.actions && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.actions}
                </p>
              )}
            </div>

            {/* Активность */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                Задание активно
              </label>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Сохранение...' : (job ? 'Обновить' : 'Создать')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobDialog; 