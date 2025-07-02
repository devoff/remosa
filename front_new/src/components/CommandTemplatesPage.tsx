import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
  Typography,
  List,
  Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useApi } from '../lib/useApi';
import { CommandTemplate, CommandTemplateCreate } from '../types';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../lib/useAuth';

const { Title } = Typography;
const { Option } = Select;

interface CommandTemplateFormValues extends Omit<CommandTemplateCreate, 'params_schema'> {
  params_schema: string;
}

const CommandTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommandTemplate | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [form] = Form.useForm();
  const api = useApi();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin';

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/command_templates');
      const templatesData = Array.isArray(response) ? response : [];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Ошибка при загрузке шаблонов команд:', error);
      message.error('Не удалось загрузить шаблоны команд');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const uniqueModels = useMemo(() => {
    const models = templates.map((t: CommandTemplate) => t.model).filter(Boolean);
    return Array.from(new Set(models as string[]));
  }, [templates]);

  const handleAddModelOrTemplate = () => {
    form.resetFields();
    setEditingTemplate(null);
    setIsModalVisible(true);
  };

  const handleAddTemplateForModel = (model: string) => {
    form.resetFields();
    setEditingTemplate(null);
    form.setFieldsValue({ model });
    setIsModalVisible(true);
  };

  const handleEdit = (template: CommandTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      ...template,
      params_schema: JSON.stringify(template.params_schema, null, 2),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.remove(`/command_templates/${id}`);
      message.success('Шаблон команды успешно удален');
      fetchTemplates();
    } catch (error) {
      message.error('Не удалось удалить шаблон команды');
    }
  };

  const onFinish = async (values: CommandTemplateFormValues) => {
    try {
      const parsedSchema = JSON.parse(values.params_schema);
      const payload: CommandTemplateCreate = { ...values, params_schema: parsedSchema };
      
      if (editingTemplate) {
        await api.put(`/command_templates/${editingTemplate.id}`, payload);
        message.success('Шаблон успешно обновлен');
      } else {
        await api.post('/command_templates', payload);
        message.success('Шаблон успешно создан');
      }
      setIsModalVisible(false);
      fetchTemplates();
    } catch (error) {
      message.error('Ошибка сохранения. Проверьте JSON схемы параметров.');
    }
  };

  const columns: ColumnsType<CommandTemplate> = [
    { title: 'Модель', dataIndex: 'model', key: 'model' },
    { title: 'Категория', dataIndex: 'category', key: 'category' },
    { title: 'Подкатегория', dataIndex: 'subcategory', key: 'subcategory' },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Шаблон', dataIndex: 'template', key: 'template' },
    { title: 'Описание', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Действия',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_: any, record: CommandTemplate) => (
        isSuperAdmin ? (
          <Space size="small">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Редактировать</Button>
            <Popconfirm title="Вы уверены?" onConfirm={() => handleDelete(record.id)}>
              <Button danger icon={<DeleteOutlined />}>Удалить</Button>
            </Popconfirm>
          </Space>
        ) : null
      ),
    },
  ];

  if (loading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827' }}>
            <Spin size="large" />
        </div>
    );
  }

  const renderModelSelection = () => (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <Title level={2} style={{ color: 'white' }}>Управление шаблонами команд</Title>
      <p className="text-gray-400 mb-4">Выберите модель устройства:</p>
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <List
          header={<div className="px-4 py-2 font-semibold text-gray-300">Модель</div>}
          dataSource={uniqueModels}
          renderItem={(model) => (
            <List.Item className="border-t border-gray-700 hover:bg-gray-700/50">
              <a onClick={() => setSelectedModel(model)} className="px-4 py-2 text-blue-400 hover:text-blue-300 w-full block">
                {model}
              </a>
            </List.Item>
          )}
        />
      </div>
      {isSuperAdmin && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddModelOrTemplate}
          className="mt-6"
        >
          Добавить модель или шаблон
        </Button>
      )}
    </div>
  );

  const renderTemplateTable = () => {
    const filteredTemplates = templates.filter((t: CommandTemplate) => t.model === selectedModel);
    return (
      <div className="p-8 bg-gray-900 min-h-screen">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedModel(null)}>
            Назад к моделям
          </Button>
          <div className="flex justify-between items-center">
            <Title level={3} style={{ color: 'white', margin: 0 }}>Шаблоны для модели: {selectedModel}</Title>
            {isSuperAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddTemplateForModel(selectedModel!)}
              >
                Добавить шаблон для {selectedModel}
              </Button>
            )}
          </div>
          <Table
            columns={columns}
            dataSource={filteredTemplates}
            rowKey="id"
            bordered
            size="middle"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            className="dark-table"
          />
        </Space>
      </div>
    );
  };

  return (
    <>
      {selectedModel ? renderTemplateTable() : renderModelSelection()}
      
      {isSuperAdmin && (
        <Modal
          title={editingTemplate ? 'Редактировать шаблон' : 'Добавить шаблон'}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ model: selectedModel || '' }}>
              <Form.Item name="model" label="Модель" rules={[{ required: true }]}>
                  <Input />
              </Form.Item>
              <Form.Item name="category" label="Категория" rules={[{ required: true }]}>
                  <Input />
              </Form.Item>
              <Form.Item name="subcategory" label="Подкатегория">
                  <Input />
              </Form.Item>
              <Form.Item name="name" label="Название" rules={[{ required: true }]}>
                  <Input />
              </Form.Item>
              <Form.Item name="template" label="Шаблон" rules={[{ required: true }]}>
                  <Input placeholder="#01#{param}#" />
              </Form.Item>
              <Form.Item name="description" label="Описание">
                  <Input.TextArea />
              </Form.Item>
              <Form.Item name="params_schema" label="Схема параметров (JSON)" rules={[{ required: true }]}>
                   <Input.TextArea rows={8} placeholder={`{
  "properties": {
    "param": { "type": "string", "title": "Параметр" }
  },
  "required": ["param"]
}`} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Сохранить
                </Button>
              </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default CommandTemplatesPage; 