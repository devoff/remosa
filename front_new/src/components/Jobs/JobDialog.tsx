import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Monitor, Smartphone, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExporterApi } from '../../lib/exporterApi';
import { JobFormData, Job, PrometheusDevice, ManagementDevice } from '../../types/exporter';
import { useNotification } from '../NotificationProvider';
import { Tooltip } from '@/components/ui/tooltip';
import { api } from '../../lib/api';
import { CommandTemplate } from '../../types/index';

interface JobDialogProps {
  job?: Job;
  onClose: () => void;
  onSave: () => void;
}

type Step = 'monitoring' | 'condition' | 'action' | 'review';

const JobDialog: React.FC<JobDialogProps> = ({ 
  job, 
  onClose, 
  onSave 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('monitoring');
  const [formData, setFormData] = useState<JobFormData>({
    name: '',
    description: '',
    job_type: 'alert',
    conditions: [],
    actions: [],
    is_active: true,
    platform_id: 1, // Будет получено из контекста пользователя
    monitoring_device_mac: '',
    monitoring_metric: '',
    operator: '',
    threshold_value: '',
    device_id: undefined,
    command: '',
    command_template_id: undefined
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prometheusDevices, setPrometheusDevices] = useState<PrometheusDevice[]>([]);
  const [managementDevices, setManagementDevices] = useState<ManagementDevice[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedDeviceMetrics, setSelectedDeviceMetrics] = useState<Record<string, any>>({});
  const [deviceCommands, setDeviceCommands] = useState<CommandTemplate[]>([]);
  const [selectedCommandTemplate, setSelectedCommandTemplate] = useState<CommandTemplate | null>(null);

  const { 
    createJob, 
    updateJob, 
    getPrometheusDevices, 
    getManagementDevices, 
    getDeviceMetrics,
    generateJobName 
  } = useExporterApi();
  const { notify } = useNotification();

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name,
        description: job.description || '',
        job_type: job.job_type,
        conditions: job.conditions,
        actions: job.actions,
        is_active: job.is_active,
        platform_id: job.platform_id,
        monitoring_device_mac: job.monitoring_device_mac || '',
        monitoring_metric: job.monitoring_metric || '',
        operator: job.operator || '',
        threshold_value: job.threshold_value || '',
        device_id: job.device_id,
        command: job.command || '',
        command_template_id: job.command_template_id
      });
    }
    loadDevices();
  }, [job]);

  const loadDevices = async () => {
    try {
      const [promDevices, mgmtDevices] = await Promise.all([
        getPrometheusDevices(),
        getManagementDevices()
      ]);
      console.log('Loaded prometheus devices:', promDevices);
      setPrometheusDevices(promDevices);
      setManagementDevices(mgmtDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      notify('Ошибка загрузки устройств', 'error');
    }
  };

  const loadDeviceMetrics = async (deviceMac: string) => {
    try {
      const metrics = await getDeviceMetrics(deviceMac);
      console.log('Ответ бэкенда на getDeviceMetrics:', metrics);
      setSelectedDeviceMetrics(metrics.metrics);
      setAvailableMetrics(Object.keys(metrics.metrics));
    } catch (error) {
      notify('Ошибка загрузки метрик устройства', 'error');
    }
  };

  const generateName = async () => {
    if (!formData.monitoring_device_mac || !formData.monitoring_metric || !formData.operator || !formData.threshold_value) {
      return;
    }
    
    try {
      const result = await generateJobName(
        formData.monitoring_device_mac,
        formData.monitoring_metric,
        formData.operator,
        formData.threshold_value
      );
      setFormData(prev => ({ ...prev, name: result.name }));
    } catch (error) {
      notify('Ошибка генерации имени', 'error');
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'monitoring':
        if (!formData.monitoring_device_mac) {
          newErrors.monitoring_device_mac = 'Выберите устройство для мониторинга';
        }
        break;
      case 'condition':
        if (!formData.monitoring_metric) {
          newErrors.monitoring_metric = 'Выберите метрику';
        }
        if (!formData.operator) {
          newErrors.operator = 'Выберите оператор';
        }
        if (!formData.threshold_value) {
          newErrors.threshold_value = 'Введите пороговое значение';
        }
        break;
      case 'action':
        if (!formData.device_id) {
          newErrors.device_id = 'Выберите устройство для управления';
        }
        if (!formData.command) {
          newErrors.command = 'Введите команду';
        }
        break;
      case 'review':
        if (!formData.name) newErrors.name = 'Название обязательно';
        if (!formData.device_id) newErrors.device_id = 'Устройство обязательно';
        if (!formData.command) newErrors.command = 'Команда обязательна';
        if (!formData.monitoring_device_mac) newErrors.monitoring_device_mac = 'Устройство мониторинга обязательно';
        if (!formData.monitoring_metric) newErrors.monitoring_metric = 'Метрика обязательна';
        if (!formData.operator) newErrors.operator = 'Оператор обязателен';
        if (!formData.threshold_value) newErrors.threshold_value = 'Порог обязателен';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      switch (currentStep) {
        case 'monitoring':
          setCurrentStep('condition');
          break;
        case 'condition':
          setCurrentStep('action');
          break;
        case 'action':
          setCurrentStep('review');
          break;
      }
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'condition':
        setCurrentStep('monitoring');
        break;
      case 'action':
        setCurrentStep('condition');
        break;
      case 'review':
        setCurrentStep('action');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[JobDialog] handleSubmit', { currentStep, formData });

    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      let result;
      if (job) {
        console.log('[JobDialog] updateJob called', { id: job.id, formData });
        result = await updateJob(job.id, formData);
        console.log('[JobDialog] updateJob result:', result);
        notify('Задание обновлено', 'success');
      } else {
        console.log('[JobDialog] createJob called', formData);
        result = await createJob(formData);
        console.log('[JobDialog] createJob result:', result);
        notify('Задание создано', 'success');
      }
      onSave();
      onClose();
    } catch (error) {
      notify('Ошибка при сохранении', 'error');
      console.error('[JobDialog] error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepProgress = () => {
    const steps = ['monitoring', 'condition', 'action', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const renderMonitoringStep = () => {
    console.log('Rendering monitoring step with:', {
      prometheusDevices: prometheusDevices.length,
      selectedValue: formData.monitoring_device_mac,
      devices: prometheusDevices.slice(0, 3) // первые 3 устройства для проверки
    });
    
    return (
      <div className="space-y-6">
        <div>
          <Label>Устройство для мониторинга</Label>
          <Select
            value={formData.monitoring_device_mac}
            onValueChange={(value) => {
              setFormData(prev => {
                const newData = { ...prev, monitoring_device_mac: value };
                return newData;
              });
              if (value) {
                loadDeviceMetrics(value);
              }
            }}
          >
            <SelectTrigger>
              {prometheusDevices.find(d => d.mac === formData.monitoring_device_mac)?.display_name || (
                <SelectValue placeholder="Выберите устройство для мониторинга" />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {prometheusDevices.map((device) => (
                <SelectItem key={device.mac} value={device.mac}>
                  {device.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.monitoring_device_mac && (
            <p className="text-red-400 text-sm mt-1">{errors.monitoring_device_mac}</p>
          )}
        </div>
      </div>
    );
  };

  const renderConditionStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Метрика</Label>
        <Select
          value={formData.monitoring_metric}
          onValueChange={(value) => setFormData(prev => ({ ...prev, monitoring_metric: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите метрику" />
          </SelectTrigger>
          <SelectContent>
            {availableMetrics.map((metric) => (
              <SelectItem key={metric} value={metric}>
                {metric === 'device_status'
                  ? <>
                      Статус устройства (1 — онлайн, 0 — офлайн)
                      <span
                        title="1 — онлайн, 0 — офлайн. Если офлайн, можно перезагрузить."
                        style={{ marginLeft: 6, color: '#aaa', cursor: 'help' }}
                      >?</span>
                      {selectedDeviceMetrics[metric] ? ` (${selectedDeviceMetrics[metric]})` : ''}
                    </>
                  : metric}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.monitoring_metric && (
          <p className="text-red-400 text-sm mt-1">{errors.monitoring_metric}</p>
        )}
      </div>

      <div>
        <Label>Оператор</Label>
        <Select
          value={formData.operator}
          onValueChange={(value) => {
            setFormData(prev => {
              // Автоматическая подстановка действия 'перезагрузить' при выборе 'Равно 0' для статуса
              if (
                prev.monitoring_metric === 'device_status' &&
                value === '=' &&
                prev.threshold_value === '0'
              ) {
                return { ...prev, operator: value, command: 'перезагрузить' };
              }
              return { ...prev, operator: value };
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите оператор" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=">">Больше чем</SelectItem>
            <SelectItem value="<">Меньше чем</SelectItem>
            <SelectItem value="=">Равно</SelectItem>
            <SelectItem value="!=">Не равно</SelectItem>
            <SelectItem value=">=">Больше или равно</SelectItem>
            <SelectItem value="<=">Меньше или равно</SelectItem>
          </SelectContent>
        </Select>
        {errors.operator && (
          <p className="text-red-400 text-sm mt-1">{errors.operator}</p>
        )}
      </div>

      <div>
        <Label>Пороговое значение</Label>
        <Input
          type="text"
          value={formData.threshold_value}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => {
              // Автоматическая подстановка действия 'перезагрузить' при выборе 'Равно 0' для статуса
              if (
                prev.monitoring_metric === 'device_status' &&
                prev.operator === '=' &&
                value === '0'
              ) {
                return { ...prev, threshold_value: value, command: 'перезагрузить' };
              }
              return { ...prev, threshold_value: value };
            });
          }}
          placeholder="Введите пороговое значение"
        />
        {errors.threshold_value && (
          <p className="text-red-400 text-sm mt-1">{errors.threshold_value}</p>
        )}
      </div>

      <div>
        <Label>Условия</Label>
        {formData.conditions.map((cond, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <Input
              value={cond.field}
              onChange={e => {
                const newConds = [...formData.conditions];
                newConds[idx].field = e.target.value;
                setFormData(prev => ({ ...prev, conditions: newConds }));
              }}
              placeholder="Поле"
            />
            <Select
              value={cond.operator}
              onValueChange={value => {
                const newConds = [...formData.conditions];
                newConds[idx].operator = value as any;
                setFormData(prev => ({ ...prev, conditions: newConds }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Оператор" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Равно</SelectItem>
                <SelectItem value="not_equals">Не равно</SelectItem>
                <SelectItem value="contains">Содержит</SelectItem>
                <SelectItem value="greater_than">Больше</SelectItem>
                <SelectItem value="less_than">Меньше</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={cond.value}
              onChange={e => {
                const newConds = [...formData.conditions];
                newConds[idx].value = e.target.value;
                setFormData(prev => ({ ...prev, conditions: newConds }));
              }}
              placeholder="Значение"
            />
            <Button type="button" onClick={() => {
              setFormData(prev => ({
                ...prev,
                conditions: prev.conditions.filter((_, i) => i !== idx)
              }));
            }}>Удалить</Button>
          </div>
        ))}
        <Button type="button" onClick={() => setFormData(prev => ({
          ...prev,
          conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
        }))}>Добавить условие</Button>
      </div>
    </div>
  );

  const renderActionStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Устройство для управления</Label>
        <Select
          value={formData.device_id?.toString()}
          onValueChange={async (value) => {
            const selectedDevice = managementDevices.find(d => d.id.toString() === value);
            setFormData(prev => ({ ...prev, device_id: parseInt(value), command: '' }));
            setSelectedCommandTemplate(null);
            setDeviceCommands([]);
            if (selectedDevice && selectedDevice.model) {
              try {
                const templates = await api.getCommandTemplatesByModel(selectedDevice.model);
                setDeviceCommands(templates);
              } catch (e) {
                setDeviceCommands([]);
              }
            }
          }}
        >
          <SelectTrigger>
            {managementDevices.find(d => d.id?.toString() === formData.device_id?.toString())?.display_name || (
              <SelectValue placeholder="Выберите устройство для управления" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-auto">
            {managementDevices.map((device) => (
              <SelectItem key={device.id} value={device.id.toString()}>
                {device.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.device_id && (
          <p className="text-red-400 text-sm mt-1">{errors.device_id}</p>
        )}
      </div>

      {deviceCommands.length > 0 && (
        <div>
          <Label>Шаблон команды</Label>
          <Select
            value={selectedCommandTemplate?.id?.toString() || ''}
            onValueChange={(value) => {
              const template = deviceCommands.find(cmd => cmd.id.toString() === value);
              setSelectedCommandTemplate(template || null);
    setFormData(prev => ({
      ...prev,
                command: template ? template.template : ''
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите команду" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {deviceCommands.map(cmd => (
                <SelectItem key={cmd.id} value={cmd.id.toString()}>
                  {cmd.name} {cmd.description ? `— ${cmd.description}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>SMS команда</Label>
        <Input
          type="text"
          value={formData.command}
          onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
          placeholder="Введите SMS команду"
        />
        {errors.command && (
          <p className="text-red-400 text-sm mt-1">{errors.command}</p>
        )}
      </div>

      <div>
        <Label>Действия</Label>
        {formData.actions.map((act, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <Select
              value={act.type}
              onValueChange={value => {
                const newActs = [...formData.actions];
                newActs[idx].type = value as any;
                setFormData(prev => ({ ...prev, actions: newActs }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_notification">Уведомление</SelectItem>
                <SelectItem value="execute_command">Команда</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={act.config?.message || ''}
              onChange={e => {
                const newActs = [...formData.actions];
                newActs[idx].config = { ...newActs[idx].config, message: e.target.value };
                setFormData(prev => ({ ...prev, actions: newActs }));
              }}
              placeholder="Сообщение/команда"
            />
            <Button type="button" onClick={() => {
              setFormData(prev => ({
                ...prev,
                actions: prev.actions.filter((_, i) => i !== idx)
              }));
            }}>Удалить</Button>
          </div>
        ))}
        <Button type="button" onClick={() => setFormData(prev => ({
          ...prev,
          actions: [...prev.actions, { type: 'send_notification', config: { message: '' } }]
        }))}>Добавить действие</Button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Название задания</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Название задания"
          />
          <Button type="button" onClick={generateName} variant="outline">
            Сгенерировать
          </Button>
        </div>
      </div>

      <div>
        <Label>Описание (опционально)</Label>
        <Input
          type="text"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Описание задания"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Сводка задания</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Устройство мониторинга:</span>
            <span className="font-medium">
              {prometheusDevices.find(d => d.mac === formData.monitoring_device_mac)?.display_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Условие:</span>
            <span className="font-medium">
              {formData.monitoring_metric} {formData.operator} {formData.threshold_value}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Устройство управления:</span>
            <span className="font-medium">
              {managementDevices.find(d => d.id === formData.device_id)?.display_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Команда:</span>
            <span className="font-medium">{formData.command}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'monitoring':
        return renderMonitoringStep();
      case 'condition':
        return renderConditionStep();
      case 'action':
        return renderActionStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'monitoring':
        return 'Выбор устройства для мониторинга';
      case 'condition':
        return 'Настройка условия';
      case 'action':
        return 'Настройка действия';
      case 'review':
        return 'Проверка и сохранение';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Шаг {['monitoring', 'condition', 'action', 'review'].indexOf(currentStep) + 1} из 4</span>
              <span>{getStepTitle()}</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button
                  type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 'monitoring'}
              >
                Назад
              </Button>
              
              <div className="flex gap-2">
                {currentStep !== 'review' ? (
                  <Button type="button" onClick={nextStep}>
                    Далее
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Сохранение...' : (job ? 'Обновить' : 'Создать')}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobDialog; 