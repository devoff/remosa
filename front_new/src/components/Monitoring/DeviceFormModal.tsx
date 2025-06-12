import React, { useState, useEffect } from 'react';
import { Device, CommandTemplate } from '../../types';
import { Select, Switch, Input } from 'antd';
import { useApi } from '../../lib/useApi';
 
interface DeviceFormModalProps {
  device: Device | null;
  onSave: (data: Device) => void;
  onClose: () => void;
  availableModels: string[];
}

interface CommandParam {
  type: string;
  title?: string;
  pattern?: string;
  enum?: any[];
}

export const DeviceFormModal = ({ device, onSave, onClose, availableModels }: DeviceFormModalProps) => {
  const { get } = useApi();
  const [formData, setFormData] = useState<Partial<Device>>(device || {
    name: '',
    phone: '',
    description: '',
    status: 'ONLINE',
    model: '',
    alert_sms_template_id: undefined,
    send_alert_sms: false,
    alert_sms_template_params: {},
  });

  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedCommandTemplate, setSelectedCommandTemplate] = useState<CommandTemplate | null>(null);

  useEffect(() => {
    const fetchCommandTemplates = async () => {
      if (!formData.model) {
        setCommandTemplates([]);
        setSelectedCategory(undefined);
        setSelectedCommandTemplate(null);
        setFormData((prev: Partial<Device>) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
        return;
      }
      setLoadingTemplates(true);
      try {
        const data: CommandTemplate[] = await get(`/commands/templates/${formData.model}`);
        setCommandTemplates(data);

        if (device && device.alert_sms_template_id) {
          const existingTemplate = data.find((t: CommandTemplate) => t.id === device.alert_sms_template_id);
          if (existingTemplate) {
            setSelectedCategory(existingTemplate.category);
            setSelectedCommandTemplate(existingTemplate);
            setFormData((prev: Partial<Device>) => ({ ...prev, alert_sms_template_params: device.alert_sms_template_params || {} }));
          } else {
            setFormData((prev: Partial<Device>) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
          }
        }

      } catch (error) {
        console.error('Ошибка получения шаблонов команд:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchCommandTemplates();
  }, [formData.model, get, device]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Device);
    onClose();
  };

  const categories = Array.from(new Set(commandTemplates.map((t: CommandTemplate) => t.category).filter(Boolean) as string[]));

  const filteredCommands = selectedCategory
    ? commandTemplates.filter((t: CommandTemplate) => t.category === selectedCategory)
    : [];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedCommandTemplate(null);
    setFormData((prev: Partial<Device>) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
  };

  const handleCommandTemplateChange = (templateId: number) => {
    const template = commandTemplates.find((t: CommandTemplate) => t.id === templateId);
    setSelectedCommandTemplate(template || null);
    setFormData((prev: Partial<Device>) => ({
      ...prev,
      alert_sms_template_id: templateId,
      alert_sms_template_params: {}
    }));
  };

  const handleParamChange = (paramName: string, value: any) => {
    setFormData((prev: Partial<Device>) => ({
      ...prev,
      alert_sms_template_params: {
        ...(prev.alert_sms_template_params || {}),
        [paramName]: value
      }
    }));
  };

  const inputClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-full";

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative" style={{
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '90%'
      }}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {device ? 'Редактировать устройство' : 'Добавить устройство'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group flex flex-col">
            <label htmlFor="name" className="text-gray-700 dark:text-gray-300 mb-1">Название</label>
            <input
              id="name"
              className={inputClasses}
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="phone" className="text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
            <input
              id="phone"
              type="tel"
              className={inputClasses}
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
              pattern="\+?[0-9\s\-\(\)]+"
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="grafana_player_id" className="text-gray-700 dark:text-gray-300 mb-1">ID плеера Grafana</label>
            <input
              id="grafana_player_id"
              className={inputClasses}
              value={formData.grafana_uid || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, grafana_uid: e.target.value})}
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="model" className="text-gray-700 dark:text-gray-300 mb-1">Модель</label>
            <Select
              id="model"
              value={formData.model}
              onChange={(value: string) => setFormData({...formData, model: value})}
              options={availableModels.map((model: string) => ({ label: model, value: model }))}
              placeholder="Выберите модель"
              className={inputClasses}
              styles={{
                popup: {
                  root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                },
              }}
              optionRender={(option) => {
                const isSelected = option.value === formData.model;
                return (
                  <div
                    style={{
                      padding: '8px 12px',
                      color: isSelected ? 'black' : '#e2e8f0',
                    }}
                  >
                    {option.label}
                  </div>
                );
              }}
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="form-group flex items-center justify-between">
            <label htmlFor="send_alert_sms" className="text-gray-700 dark:text-gray-300">Включить управление по СМС</label>
            <Switch
              id="send_alert_sms"
              checked={formData.send_alert_sms}
              onChange={(checked: boolean) => setFormData({...formData, send_alert_sms: checked})}
            />
          </div>

          {formData.send_alert_sms && (
            <>
              <div className="form-group flex flex-col">
                <label htmlFor="command_category" className="text-gray-700 dark:text-gray-300 mb-1">Категория команды</label>
                <Select
                  id="command_category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  options={categories.map((cat: string) => ({ label: cat, value: cat }))}
                  placeholder="Выберите категорию"
                  loading={loadingTemplates}
                  disabled={!formData.model || loadingTemplates}
                  className={inputClasses}
                  style={{ width: '100%' }}
                  size="large"
                  styles={{
                    popup: {
                      root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                    },
                  }}
                  optionRender={(option) => {
                    const isSelected = option.value === selectedCategory;
                    return (
                      <div
                        style={{
                          padding: '8px 12px',
                          color: isSelected ? 'black' : '#e2e8f0',
                        }}
                      >
                        {option.label}
                      </div>
                    );
                  }}
                />
              </div>

              {selectedCategory && (
                <div className="form-group flex flex-col">
                  <label htmlFor="alert_sms_template_id" className="text-gray-700 dark:text-gray-300 mb-1">Команда SMS-оповещения</label>
                  <Select
                    id="alert_sms_template_id"
                    value={formData.alert_sms_template_id}
                    onChange={(value: number) => handleCommandTemplateChange(value)}
                    options={filteredCommands.map((template: CommandTemplate) => ({
                      label: template.name,
                      value: template.id
                    }))}
                    placeholder="Выберите команду"
                    loading={loadingTemplates}
                    disabled={!selectedCategory || loadingTemplates}
                    className={inputClasses}
                    style={{ width: '100%' }}
                    styles={{
                      popup: {
                        root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                      },
                    }}
                    optionRender={(option) => {
                      const isSelected = option.value === formData.alert_sms_template_id;
                      return (
                        <div
                          style={{
                            padding: '8px 12px',
                            color: isSelected ? 'black' : '#e2e8f0',
                          }}
                        >
                          {option.label}
                        </div>
                      );
                    }}
                  />
                </div>
              )}

              {selectedCommandTemplate && selectedCommandTemplate.params_schema?.properties && (
                <div className="space-y-4 border p-3 rounded-md dark:border-gray-600">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Параметры команды:</h4>
                  {Object.entries(selectedCommandTemplate.params_schema.properties).map(([paramName, param]: [string, CommandParam]) => {
                    const isRequired = selectedCommandTemplate.params_schema.required?.includes(paramName);
                    
                    let inputComponent;
                    if (param.type === 'string') {
                      inputComponent = <Input placeholder={param.title || paramName} />;
                    } else if (param.type === 'number' || param.type === 'integer') {
                      inputComponent = <Input type="number" placeholder={param.title || paramName} />;
                    } else if (param.type === 'boolean') {
                      inputComponent = <Switch checkedChildren="Вкл" unCheckedChildren="Выкл" />;
                    } else if (param.enum) {
                      inputComponent = (
                        <Select placeholder={param.title || paramName} className={inputClasses} style={{ width: '100%' }}
                          styles={{
                            popup: {
                              root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                            },
                          }}
                          optionRender={(option) => {
                            const isSelected = option.value === formData.alert_sms_template_params?.[paramName];
                            return (
                              <div
                                style={{
                                  padding: '8px 12px',
                                  color: isSelected ? 'black' : '#e2e8f0',
                                }}
                              >
                                {option.label}
                              </div>
                            );
                          }}
                        >
                          {param.enum.map((option: any) => (
                            <Select.Option key={option} value={option}>{String(option)}</Select.Option>
                          ))}
                        </Select>
                      );
                    } else {
                      inputComponent = <Input placeholder={param.title || paramName} />;
                    }

                    return (
                      <div className="form-group flex flex-col" key={paramName}>
                        <label htmlFor={`param-${paramName}`} className="text-gray-700 dark:text-gray-300 mb-1">
                          {param.title || paramName}{isRequired ? ' *' : ''}
                        </label>
                        {React.cloneElement(inputComponent, {
                          id: `param-${paramName}`,
                          value: formData.alert_sms_template_params?.[paramName] || '',
                          onChange: (e: React.ChangeEvent<HTMLInputElement> | boolean | string | number) => handleParamChange(paramName, (typeof e === 'object' && 'target' in e) ? e.target.value : e),
                          className: inputClasses,
                          style: { width: '100%' }
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="form-group flex flex-col">
            <label htmlFor="description" className="text-gray-700 dark:text-gray-300 mb-1">Описание</label>
            <textarea
              id="description"
              className={`${inputClasses} h-24`}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-actions flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-700 transition duration-300">
              Отмена
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
