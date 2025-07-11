import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApi } from '../lib/useApi';
const { Option } = Select;
const { Panel } = Collapse;
const CommandTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form] = Form.useForm();
    const { get, post, put, delete: del } = useApi();
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedCategoryInForm, setSelectedCategoryInForm] = useState(null);
    const fetchCommandTemplates = async () => {
        try {
            const url = selectedModel
                ? `/api/v1/commands/templates/${selectedModel}`
                : '/api/v1/commands/templates';
            const data = await get(url);
            return data.map((template) => ({
                ...template,
                params_schema: typeof template.params_schema === 'string'
                    ? JSON.parse(template.params_schema || '{}')
                    : template.params_schema || {}
            }));
        }
        catch (error) {
            console.error('Ошибка при получении шаблонов команд:', error);
            message.error('Не удалось загрузить шаблоны команд.');
            return [];
        }
    };
    const saveCommandTemplate = async (values) => {
        try {
            const payload = {
                ...values,
                params_schema: JSON.stringify(values.params_schema)
            };
            if (editingTemplate) {
                await put(`/api/v1/commands/templates/${editingTemplate.id}`, payload);
                message.success('Шаблон команды успешно обновлен!');
            }
            else {
                await post('/api/v1/commands/templates', payload);
                message.success('Шаблон команды успешно добавлен!');
            }
            setIsModalVisible(false);
            fetchTemplates();
        }
        catch (error) {
            console.error('Ошибка при сохранении шаблона команды:', error);
            message.error('Не удалось сохранить шаблон команды.');
        }
    };
    const deleteCommandTemplate = async (id) => {
        try {
            await del(`/api/v1/commands/templates/${id}`);
            message.success('Шаблон команды успешно удален!');
            fetchTemplates();
        }
        catch (error) {
            console.error('Ошибка при удалении шаблона команды:', error);
            message.error('Не удалось удалить шаблон команды.');
        }
    };
    const fetchTemplates = async () => {
        try {
            const data = await fetchCommandTemplates();
            setTemplates(data);
        }
        catch (error) {
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
    const handleEdit = (template) => {
        setEditingTemplate(template);
        form.setFieldsValue({
            ...template,
            params_schema: JSON.stringify(template.params_schema, null, 2)
        });
        setSelectedCategoryInForm(template.category);
        setIsModalVisible(true);
    };
    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Вы уверены, что хотите удалить этот шаблон?',
            onOk: () => deleteCommandTemplate(id),
        });
    };
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };
    const onFinish = (values) => {
        try {
            const parsedParamsSchema = values.params_schema ? JSON.parse(values.params_schema) : {};
            saveCommandTemplate({
                ...values,
                params_schema: parsedParamsSchema
            });
        }
        catch (e) {
            message.error('Неверный формат JSON для схемы параметров.');
            console.error('Ошибка парсинга params_schema:', e);
        }
    };
    // Группируем шаблоны по моделям
    const models = Array.from(new Set(templates.map((t) => t.model))).filter(Boolean);
    // Собираем уникальные категории и названия
    const uniqueCategories = Array.from(new Set(templates.map((t) => t.category))).filter(Boolean);
    const uniqueNames = Array.from(new Set(templates.map((t) => t.name))).filter(Boolean);
    const filteredTemplates = selectedModel
        ? templates.filter((t) => t.model === selectedModel)
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
            render: (_, record) => (_jsxs(Space, { size: "middle", children: [_jsx(Button, { icon: _jsx(EditOutlined, {}), onClick: () => handleEdit(record), children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx(Button, { icon: _jsx(DeleteOutlined, {}), danger: true, onClick: () => handleDelete(record.id), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })),
        },
    ];
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h2", { children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430\u043C\u0438 \u043A\u043E\u043C\u0430\u043D\u0434" }), !selectedModel ? (_jsxs(_Fragment, { children: [_jsx("h3", { children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430:" }), _jsx(Table, { dataSource: models.map(model => ({ model })), columns: [
                            {
                                title: 'Модель',
                                dataIndex: 'model',
                                key: 'model',
                                render: (text) => (_jsx(Button, { type: "link", onClick: () => setSelectedModel(text), children: text }))
                            }
                        ], rowKey: "model", pagination: false }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAdd, style: { marginTop: '20px' }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C \u0438\u043B\u0438 \u0448\u0430\u0431\u043B\u043E\u043D" })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: () => setSelectedModel(null), style: { marginBottom: '20px' }, children: "\u2190 \u041D\u0430\u0437\u0430\u0434 \u043A \u043C\u043E\u0434\u0435\u043B\u044F\u043C" }), _jsxs("h3", { children: ["\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438: ", selectedModel] }), _jsxs(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAdd, style: { marginBottom: '20px' }, children: ["\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D \u0434\u043B\u044F ", selectedModel] }), _jsx(Table, { columns: columns, dataSource: filteredTemplates, rowKey: "id" })] })), _jsx(Modal, { title: editingTemplate ? 'Редактировать шаблон команды' : 'Добавить шаблон команды', open: isModalVisible, onCancel: handleCancel, footer: null, children: _jsxs(Form, { form: form, onFinish: onFinish, layout: "vertical", children: [_jsx(Form.Item, { name: "model", label: "\u041C\u043E\u0434\u0435\u043B\u044C", rules: [{ required: true, message: 'Пожалуйста, введите модель!' }], children: _jsx(Input, { disabled: !!selectedModel && !!editingTemplate }) }), _jsx(Form.Item, { name: "category", label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", rules: [{ required: true, message: 'Пожалуйста, введите категорию!' }], children: _jsx(Select, { showSearch: true, allowClear: true, options: uniqueCategories.map(cat => ({ label: cat, value: cat })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u043B\u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E", onChange: (value) => setSelectedCategoryInForm(value) }) }), _jsx(Form.Item, { name: "subcategory", label: "\u041F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "name", label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", rules: [{ required: true, message: 'Пожалуйста, введите название!' }], children: _jsx(Select, { showSearch: true, allowClear: true, options: templates
                                    .filter((t) => t.category === selectedCategoryInForm)
                                    .map((t) => t.name)
                                    .filter(Boolean)
                                    .map(name => ({ label: name, value: name })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u043B\u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", disabled: !selectedCategoryInForm }) }), _jsx(Form.Item, { name: "template", label: "\u0428\u0430\u0431\u043B\u043E\u043D", rules: [{ required: true, message: 'Пожалуйста, введите шаблон команды!' }], children: _jsx(Input, {}) }), _jsx(Form.Item, { name: "description", label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", children: _jsx(Input.TextArea, { rows: 4 }) }), _jsx(Collapse, { ghost: true, items: [
                                {
                                    key: '1',
                                    label: 'Параметры команды (JSON)',
                                    children: (_jsx(Form.Item, { name: "params_schema", label: "\u0421\u0445\u0435\u043C\u0430 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432 (JSON)", rules: [
                                            { required: true, message: 'Пожалуйста, введите схему параметров!' },
                                            () => ({
                                                validator(_, value) {
                                                    try {
                                                        if (value)
                                                            JSON.parse(value);
                                                        return Promise.resolve();
                                                    }
                                                    catch (error) {
                                                        return Promise.reject(new Error('Неверный формат JSON!'));
                                                    }
                                                },
                                            }),
                                        ], children: _jsx(Input.TextArea, { rows: 6, placeholder: JSON.stringify({
                                                "type": "object",
                                                "properties": {
                                                    "param1": { "type": "string", "title": "Параметр 1" },
                                                    "param2": { "type": "number", "title": "Параметр 2" }
                                                },
                                                "required": ["param1"]
                                            }, null, 2) }) })),
                                },
                            ] }), _jsxs(Form.Item, { children: [_jsx(Button, { type: "primary", htmlType: "submit", children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" }), _jsx(Button, { onClick: handleCancel, style: { marginLeft: '8px' }, children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] }) })] }));
};
export default CommandTemplatesPage;
