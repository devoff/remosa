import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Select, Input, InputNumber, message, Spin } from 'antd';
import { useApi } from '../lib/useApi';
import { Device, CommandTemplate } from '../types';

interface ExecuteCommandModalProps {
  visible: boolean;
  onClose: () => void;
  device: Device;
}

const ExecuteCommandModal: React.FC<ExecuteCommandModalProps> = ({ visible, onClose, device }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CommandTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (visible && device) {
      fetchTemplates();
    }
  }, [visible, device]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await api.get(`/command_templates?model=${device.model || ''}`);
      const templates = Array.isArray(response) ? response : [];
      setTemplates(templates);
      setLoadingTemplates(false);
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов команд:', error);
      message.error('Не удалось загрузить шаблоны команд');
      setLoadingTemplates(false);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.resetFields(['params']);
    }
  };

  const handleExecute = async () => {
    try {
      const values = await form.validateFields();
      
      const paramsWithCorrectTypes = { ...values.params };
      if (selectedTemplate?.params_schema?.properties) {
        for (const key in selectedTemplate.params_schema.properties) {
          const paramDef = selectedTemplate.params_schema.properties[key];
          if (paramDef.type === 'number' && typeof paramsWithCorrectTypes[key] === 'string') {
            paramsWithCorrectTypes[key] = parseFloat(paramsWithCorrectTypes[key]);
          }
        }
      }
      
      const payload = {
        device_id: device.id,
        template_id: selectedTemplate!.id,
        params: paramsWithCorrectTypes || {},
      };
      
      setLoading(true);
      await api.post('/commands/execute', payload);
      message.success('Команда успешно отправлена');
      onClose();
    } catch (error) {
      console.error('Ошибка при выполнении команды:', error);
      message.error('Не удалось выполнить команду');
    } finally {
      setLoading(false);
    }
  };

  const renderParamInput = (key: string, param: any) => {
    const isRequired = selectedTemplate?.params_schema?.required?.includes(key);
    const rules = isRequired ? [{ required: true, message: `Поле '${param.title || key}' обязательно` }] : [];
    
    if (param.type === 'number') {
      return (
        <Form.Item key={key} name={['params', key]} label={param.title || key} rules={rules}>
          <InputNumber min={param.min} max={param.max} style={{ width: '100%' }} />
        </Form.Item>
      );
    }

    return (
      <Form.Item key={key} name={['params', key]} label={param.title || key} rules={rules}>
        <Input pattern={param.pattern} />
      </Form.Item>
    );
  };

  const renderParamsForm = () => {
    if (!selectedTemplate || !selectedTemplate.params_schema) {
      return null;
    }

    const { properties } = selectedTemplate.params_schema;
    if (!properties || Object.keys(properties).length === 0) {
      return <p>Эта команда не имеет параметров</p>;
    }

    return (
      <div>
        <h4 className="mb-4">Параметры команды</h4>
        {Object.entries(properties).map(([key, param]) => renderParamInput(key, param))}
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      title={`Выполнить команду на устройстве ${device.name}`}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleExecute}
          disabled={!selectedTemplate}
        >
          Выполнить
        </Button>,
      ]}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="template_id"
          label="Шаблон команды"
          rules={[{ required: true, message: 'Выберите шаблон команды' }]}
        >
          <Select
            placeholder="Выберите шаблон команды"
            onChange={handleTemplateChange}
            loading={loadingTemplates}
            disabled={loading}
          >
            {templates.map((template) => (
              <Select.Option key={template.id} value={template.id}>
                {template.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedTemplate && (
          <div className="mb-4">
            <p>{selectedTemplate.description}</p>
          </div>
        )}

        {loadingTemplates ? <Spin /> : renderParamsForm()}
      </Form>
    </Modal>
  );
};

export default ExecuteCommandModal; 