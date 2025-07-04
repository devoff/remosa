import React, { useState, useEffect } from 'react';
import { Device, CommandTemplate, Platform } from '../../types';
import { Select, Switch, Input, Button, Modal, Typography, Popconfirm, message } from 'antd';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/useAuth';
import apiClient from '../../lib/api';
import { SaveOutlined, CloseOutlined, MobileOutlined, AppstoreOutlined, FileTextOutlined, ToolOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

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

export const DeviceFormModal = ({ device, onSave, onClose, availableModels: _availableModels }: DeviceFormModalProps) => {
  const { get, remove } = useApi();
  const { user, currentPlatform } = useAuth();
  const [formData, setFormData] = useState<Partial<Device>>({});

  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedCommandTemplate, setSelectedCommandTemplate] = useState<CommandTemplate | null>(null);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const isSuperAdmin = user?.role === 'superadmin';

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
        setFormData(device);
    } else {
        setFormData({
            name: '',
            phone: '',
            description: '',
            status: 'ONLINE',
            model: '',
            alert_sms_template_id: undefined,
            send_alert_sms: false,
            alert_sms_template_params: {},
            platform_id: isSuperAdmin ? undefined : currentPlatform?.id
        });
    }
  }, [device, isSuperAdmin, currentPlatform]);

  useEffect(() => {
    apiClient.get('/command_templates/').then(res => {
      const models = Array.from(new Set(res.data.map((t: any) => String(t.model)).filter(Boolean))) as string[];
      setAvailableModels(models);
    });
  }, []);

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

  useEffect(() => {
    async function fetchPlatforms() {
      let response;
      if (user?.role === 'superadmin') {
        response = await apiClient.get('/platforms/');
      } else {
        response = await apiClient.get('/platforms/my-platforms/');
      }
      setPlatforms(response.data);
    }
    fetchPlatforms();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData as Device);
      onClose();
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        message.error(err.response.data.detail);
      } else if (err?.message) {
        message.error(err.message);
      } else {
        message.error('Ошибка при сохранении устройства');
      }
    } finally {
      setSaving(false);
    }
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

  // Удаление устройства
  const handleDelete = async () => {
    if (!device || !device.id) return;
    try {
      // Определяем эндпоинт
      let endpoint = `/devices/${device.id}`;
      if (device.platform_id && user?.platform_roles?.some(r => r.platform_id === device.platform_id && (r.role === 'admin' || r.role === 'manager'))) {
        endpoint = `/platforms/${device.platform_id}/devices/${device.id}`;
      }
      await remove(endpoint);
      message.success('Устройство удалено');
      onSave(null as any); // чтобы обновить список
      onClose();
    } catch (err) {
      message.error('Ошибка при удалении устройства');
    }
  };

  // --- Новый современный стиль ---
  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      closeIcon={<CloseOutlined style={{ fontSize: 20 }} />}
      bodyStyle={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: 32,
        color: '#222',
      }}
      style={{ borderRadius: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <ToolOutlined style={{ fontSize: 32, color: '#1890ff', marginRight: 12 }} />
        <Title level={4} style={{ color: '#222', margin: 0, flex: 1 }}>
          {device ? 'Редактировать устройство' : 'Добавить устройство'}
        </Title>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Платформа */}
        {platforms.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#555', marginBottom: 4, display: 'block' }}>Платформа</label>
            {isSuperAdmin ? (
              <Select
                value={formData.platform_id}
                onChange={(value: number) => {
                  setFormData(prev => ({ ...prev, platform_id: value }));
                }}
                options={platforms.map((p) => ({ label: p.name, value: p.id }))}
                placeholder="Выберите платформу"
                style={{ width: '100%' }}
                size="large"
              />
            ) : (
              <Input
                value={platforms.find(p => p.id === formData.platform_id)?.name || '—'}
                disabled
                size="large"
                style={{ width: '100%' }}
              />
            )}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Название</label>
          <Input
            prefix={<AppstoreOutlined />}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            size="large"
            placeholder="Введите название устройства"
            style={{ borderRadius: 8 }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Телефон</label>
          <Input
            prefix={<MobileOutlined />}
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            pattern="\+?[0-9\s\-\(\)]+"
            size="large"
            placeholder="+7 (999) 123-45-67"
            style={{ borderRadius: 8 }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>ID плеера Grafana</label>
          <Input
            value={formData.grafana_uid || ''}
            onChange={e => setFormData({ ...formData, grafana_uid: e.target.value })}
            size="large"
            placeholder="ID Grafana"
            style={{ borderRadius: 8 }}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Модель</label>
          <Select
            value={formData.model}
            onChange={value => setFormData({ ...formData, model: value })}
            options={availableModels.map((model) => ({ label: model, value: model }))}
            placeholder="Выберите модель"
            style={{ width: '100%' }}
            size="large"
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </div>
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Switch
            checked={!!formData.send_alert_sms}
            onChange={checked => setFormData({ ...formData, send_alert_sms: checked })}
            style={{ background: formData.send_alert_sms ? '#1890ff' : '#444' }}
          />
          <span style={{ color: '#b0b8c9' }}>Включить управление по СМС</span>
        </div>

        {formData.send_alert_sms && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Категория команды</label>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                options={categories.map(cat => ({ label: cat, value: cat }))}
                placeholder="Выберите категорию"
                style={{ width: '100%' }}
                size="large"
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Команда SMS-оповещения</label>
              <Select
                value={selectedCommandTemplate?.id}
                onChange={handleCommandTemplateChange}
                options={filteredCommands.map(cmd => ({ label: cmd.name, value: cmd.id }))}
                placeholder="Выберите команду"
                style={{ width: '100%' }}
                size="large"
              />
            </div>
          </>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#b0b8c9', marginBottom: 4, display: 'block' }}>Описание</label>
          <Input.TextArea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            size="large"
            placeholder="Описание устройства"
            style={{ borderRadius: 8, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: device ? 'space-between' : 'flex-end', gap: 12, marginTop: 24 }}>
          {device && device.id && (
            <Popconfirm
              title="Удалить устройство?"
              description="Вы уверены, что хотите удалить это устройство?"
              onConfirm={handleDelete}
              okText="Да"
              cancelText="Нет"
            >
              <Button danger icon={<DeleteOutlined />} size="large">
                Удалить
              </Button>
            </Popconfirm>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={onClose} icon={<CloseOutlined />} size="large">
              Отмена
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{ borderRadius: 8 }} disabled={saving} loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default DeviceFormModal;
