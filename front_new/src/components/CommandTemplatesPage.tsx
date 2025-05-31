import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { CommandTemplate, CommandTemplateCreate, CommandParamDefinition } from '../types';
import { useApi } from '../lib/useApi';

const { Option } = Select;
const { Panel } = Collapse;

// Define a type for the form values, where params_schema is a string
interface CommandTemplateFormValues extends Omit<CommandTemplateCreate, 'params_schema'> {
  params_schema: string;
}

const CommandTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommandTemplate | null>(null);
  const [form] = Form.useForm<CommandTemplateFormValues>();
  const { get, post, put, delete: del } = useApi();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCategoryInForm, setSelectedCategoryInForm] = useState<string | null>(null);

  const fetchCommandTemplates = async (): Promise<CommandTemplate[]> => {
    try {
      const url = selectedModel 
        ? `/api/v1/commands/templates/${selectedModel}` 
        : '/api/v1/commands/templates';
      const data = await get(url);
      return data.map((template: any) => ({
        ...template,
        params_schema: typeof template.params_schema === 'string' 
                       ? JSON.parse(template.params_schema || '{}') 
                       : template.params_schema || {}
      }));
    } catch (error) {
      console.error('Ошибка при получении шаблонов команд:', error);
      message.error('Не удалось загрузить шаблоны команд.');
      return [];
    }
  };

  const saveCommandTemplate = async (values: CommandTemplateCreate) => {
    try {
      const payload = {
        ...values,
        params_schema: JSON.stringify(values.params_schema)
      };

      if (editingTemplate) {
        await put(`/api/v1/commands/templates/${editingTemplate.id}`, payload);
        message.success('Шаблон команды успешно обновлен!');
      } else {
        await post('/api/v1/commands/templates', payload);
        message.success('Шаблон команды успешно добавлен!');
      }
      setIsModalVisible(false);
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка при сохранении шаблона команды:', error);
      message.error('Не удалось сохранить шаблон команды.');
    }
  };

  const deleteCommandTemplate = async (id: number) => {
    try {
      await del(`/api/v1/commands/templates/${id}`);
      message.success('Шаблон команды успешно удален!');
      fetchTemplates();
    } catch (error) {
      console.error('Ошибка при удалении шаблона команды:', error);
      message.error('Не удалось удалить шаблон команды.');
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await fetchCommandTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов команд:', error);
      message.error('Не удалось загрузить шаблоны команд.');
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedModel]);

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    if (selectedModel) {
      form.setFieldsValue({ model: selectedModel });
    }
    setIsModalVisible(true);
  };

  const handleEdit = (template: CommandTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      ...template,
      params_schema: JSON.stringify(template.params_schema, null, 2)
    });
    setSelectedCategoryInForm(template.category);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Вы уверены, что хотите удалить этот шаблон?',
      onOk: () => deleteCommandTemplate(id),
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = (values: CommandTemplateFormValues) => {
    try {
      const parsedParamsSchema = values.params_schema ? JSON.parse(values.params_schema) : {};
      saveCommandTemplate({
        ...values,
        params_schema: parsedParamsSchema
      } as CommandTemplateCreate);
    } catch (e) {
      message.error('Неверный формат JSON для схемы параметров.');
      console.error('Ошибка парсинга params_schema:', e);
    }
  };

  // Группируем шаблоны по моделям
  const models = Array.from(new Set(templates.map((t: CommandTemplate) => t.model))).filter(Boolean) as string[];

  // Собираем уникальные категории и названия
  const uniqueCategories = Array.from(new Set(templates.map((t: CommandTemplate) => t.category))).filter(Boolean) as string[];
  const uniqueNames = Array.from(new Set(templates.map((t: CommandTemplate) => t.name))).filter(Boolean) as string[];

  const filteredTemplates = selectedModel 
    ? templates.filter((t: CommandTemplate) => t.model === selectedModel) 
    : templates;

  const columns = [
    { title: 'Модель', dataIndex: 'model', key: 'model' },
    { title: 'Категория', dataIndex: 'category', key: 'category' },
    { title: 'Подкатегория', dataIndex: 'subcategory', key: 'subcategory' },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Шаблон', dataIndex: 'template', key: 'template' },
    { title: 'Описание', dataIndex: 'description', key: 'description' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: CommandTemplate) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Редактировать</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Удалить</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Управление шаблонами команд</h2>
      {!selectedModel ? (
        <>
          <h3>Выберите модель устройства:</h3>
          <Table 
            dataSource={models.map(model => ({ model }))} 
            columns={[
              { 
                title: 'Модель', 
                dataIndex: 'model', 
                key: 'model',
                render: (text: string) => (
                  <Button type="link" onClick={() => setSelectedModel(text)}>{text}</Button>
                )
              }
            ]} 
            rowKey="model" 
            pagination={false}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginTop: '20px' }}>
            Добавить модель или шаблон
          </Button>
        </>
      ) : (
        <>
          <Button onClick={() => setSelectedModel(null)} style={{ marginBottom: '20px' }}>
            ← Назад к моделям
          </Button>
          <h3>Шаблоны для модели: {selectedModel}</h3>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: '20px' }}>
            Добавить шаблон для {selectedModel}
          </Button>
          <Table 
            columns={columns} 
            dataSource={filteredTemplates} 
            rowKey="id" 
          />
        </>
      )}

      <Modal
        title={editingTemplate ? 'Редактировать шаблон команды' : 'Добавить шаблон команды'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="model"
            label="Модель"
            rules={[{ required: true, message: 'Пожалуйста, введите модель!' }]}
          >
            <Input disabled={!!selectedModel && !!editingTemplate} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Категория"
            rules={[{ required: true, message: 'Пожалуйста, введите категорию!' }]}
          >
            <Select
              showSearch
              allowClear
              options={uniqueCategories.map(cat => ({ label: cat, value: cat }))}
              placeholder="Выберите или введите категорию"
              onChange={(value: string) => setSelectedCategoryInForm(value)}
            />
          </Form.Item>
          <Form.Item
            name="subcategory"
            label="Подкатегория"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Пожалуйста, введите название!' }]}
          >
            <Select
              showSearch
              allowClear
              options={templates
                .filter((t: CommandTemplate) => t.category === selectedCategoryInForm)
                .map((t: CommandTemplate) => t.name)
                .filter(Boolean)
                .map(name => ({ label: name, value: name }))}
              placeholder="Выберите или введите название"
              disabled={!selectedCategoryInForm}
            />
          </Form.Item>
          <Form.Item
            name="template"
            label="Шаблон"
            rules={[{ required: true, message: 'Пожалуйста, введите шаблон команды!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Описание"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Collapse ghost items={[
            {
              key: '1',
              label: 'Параметры команды (JSON)',
              children: (
                <Form.Item
                  name="params_schema"
                  label="Схема параметров (JSON)"
                  rules={[
                    { required: true, message: 'Пожалуйста, введите схему параметров!' },
                    () => ({
                      validator(_: any, value: string) {
                        try {
                          if (value) JSON.parse(value);
                          return Promise.resolve();
                        } catch (error) {
                          return Promise.reject(new Error('Неверный формат JSON!'));
                        }
                      },
                    }),
                  ]}
                >
                  <Input.TextArea 
                    rows={6} 
                    placeholder={
                      JSON.stringify({
                        "type": "object",
                        "properties": {
                          "param1": {"type": "string", "title": "Параметр 1"},
                          "param2": {"type": "number", "title": "Параметр 2"}
                        },
                        "required": ["param1"]
                      }, null, 2)
                    }
                  />
                </Form.Item>
              ),
            },
          ]} />

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Сохранить
            </Button>
            <Button onClick={handleCancel} style={{ marginLeft: '8px' }}>
              Отмена
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommandTemplatesPage; 