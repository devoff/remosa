import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import commandTemplatesService from '../../services/commandTemplatesService';
export const CommandSelector = ({ deviceId, deviceModel, value, onChange, onCommandSelect, error }) => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [parameters, setParameters] = useState({});
    const [finalCommand, setFinalCommand] = useState('');
    const [loading, setLoading] = useState(false);
    // Загрузка категорий
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await commandTemplatesService.getCategories();
                setCategories(cats);
                if (cats.length > 0) {
                    setSelectedCategory(cats[0]);
                }
            }
            catch (error) {
                console.error('Error loading command categories:', error);
            }
        };
        loadCategories();
    }, []);
    // Загрузка подкатегорий при изменении категории
    useEffect(() => {
        const loadSubcategories = async () => {
            if (!selectedCategory)
                return;
            try {
                const subcats = await commandTemplatesService.getSubcategories(selectedCategory);
                setSubcategories(subcats);
                setSelectedSubcategory('');
            }
            catch (error) {
                console.error('Error loading subcategories:', error);
            }
        };
        loadSubcategories();
    }, [selectedCategory]);
    // Загрузка шаблонов команд
    useEffect(() => {
        const loadTemplates = async () => {
            if (!selectedCategory)
                return;
            setLoading(true);
            try {
                let templatesData;
                if (deviceId) {
                    // Если есть deviceId, загружаем шаблоны для конкретного устройства
                    templatesData = await commandTemplatesService.getTemplatesByDevice(deviceId);
                }
                else if (deviceModel) {
                    // Если есть модель устройства, фильтруем по модели
                    templatesData = await commandTemplatesService.getTemplatesByModel(deviceModel);
                }
                else {
                    // Иначе загружаем по категории
                    templatesData = await commandTemplatesService.getTemplatesByCategory(selectedCategory);
                }
                // Дополнительная фильтрация по подкатегории
                if (selectedSubcategory) {
                    templatesData = templatesData.filter(t => t.subcategory === selectedSubcategory);
                }
                setTemplates(templatesData);
            }
            catch (error) {
                console.error('Error loading command templates:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadTemplates();
    }, [selectedCategory, selectedSubcategory, deviceId, deviceModel]);
    // Генерация финальной команды при изменении параметров
    useEffect(() => {
        if (!selectedTemplate)
            return;
        try {
            let command = selectedTemplate.template;
            // Заменяем параметры в шаблоне
            Object.entries(parameters).forEach(([key, value]) => {
                const placeholder = `{${key}}`;
                command = command.replace(new RegExp(placeholder, 'g'), String(value));
            });
            setFinalCommand(command);
        }
        catch (error) {
            console.error('Error generating final command:', error);
            setFinalCommand('');
        }
    }, [selectedTemplate, parameters]);
    const handleTemplateChange = (templateId) => {
        const template = templates.find(t => t.id.toString() === templateId);
        setSelectedTemplate(template || null);
        setParameters({});
        onChange(template ? template.id : undefined);
        if (template && onCommandSelect) {
            onCommandSelect(template, {}, template.template);
        }
    };
    const handleParameterChange = (paramName, value) => {
        const newParameters = { ...parameters, [paramName]: value };
        setParameters(newParameters);
        if (selectedTemplate && onCommandSelect) {
            let command = selectedTemplate.template;
            Object.entries(newParameters).forEach(([key, val]) => {
                const placeholder = `{${key}}`;
                command = command.replace(new RegExp(placeholder, 'g'), String(val));
            });
            onCommandSelect(selectedTemplate, newParameters, command);
        }
    };
    const validateParameter = (paramName, value) => {
        if (!selectedTemplate)
            return null;
        const paramSchema = selectedTemplate.params_schema.properties[paramName];
        if (!paramSchema)
            return null;
        const isRequired = selectedTemplate.params_schema.required?.includes(paramName);
        if (isRequired && !value) {
            return 'Это поле обязательно';
        }
        if (paramSchema.pattern && !new RegExp(paramSchema.pattern).test(value)) {
            return 'Неверный формат';
        }
        if (paramSchema.enum && !paramSchema.enum.includes(value)) {
            return 'Неверное значение';
        }
        return null;
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsxs(Select, { value: selectedCategory, onValueChange: setSelectedCategory, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" }) }), _jsx(SelectContent, { children: categories.map((cat) => (_jsx(SelectItem, { value: cat, children: cat }, cat))) })] })] }), subcategories.length > 0 && (_jsxs("div", { children: [_jsx(Label, { children: "\u041F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F" }), _jsxs(Select, { value: selectedSubcategory, onValueChange: setSelectedSubcategory, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "\u0412\u0441\u0435 \u043F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }), subcategories.map((subcat) => (_jsx(SelectItem, { value: subcat, children: subcat }, subcat)))] })] })] }))] }), _jsxs("div", { children: [_jsx(Label, { children: "\u0428\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsxs(Select, { value: value?.toString() || '', onValueChange: handleTemplateChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: loading ? "Загрузка..." : "Выберите шаблон команды" }) }), _jsx(SelectContent, { className: "max-h-60", children: templates.map((template) => (_jsx(SelectItem, { value: template.id.toString(), children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: template.name }), template.subcategory && (_jsx("span", { className: "text-xs text-muted-foreground", children: template.subcategory }))] }) }, template.id))) })] }), error && (_jsxs("p", { className: "text-red-500 text-sm mt-1 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), error] }))] }), selectedTemplate && (_jsxs(Card, { className: "bg-muted/50", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [selectedTemplate.name, selectedTemplate.subcategory && (_jsx(Badge, { variant: "outline", children: selectedTemplate.subcategory }))] }) }), _jsxs(CardContent, { className: "space-y-4", children: [selectedTemplate.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: selectedTemplate.description })), selectedTemplate.params_schema.properties &&
                                Object.keys(selectedTemplate.params_schema.properties).length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-sm font-medium", children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), Object.entries(selectedTemplate.params_schema.properties).map(([paramName, paramSchema]) => {
                                        const isRequired = selectedTemplate.params_schema.required?.includes(paramName);
                                        const error = validateParameter(paramName, parameters[paramName]);
                                        return (_jsxs("div", { className: "space-y-1", children: [_jsxs(Label, { className: "text-sm", children: [paramSchema.title || paramName, isRequired && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] }), paramSchema.enum ? (_jsxs(Select, { value: parameters[paramName] || '', onValueChange: (value) => handleParameterChange(paramName, value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: `Выберите ${paramSchema.title || paramName}` }) }), _jsx(SelectContent, { children: paramSchema.enum.map((option) => (_jsx(SelectItem, { value: option, children: option }, option))) })] })) : (_jsx(Input, { type: paramSchema.type === 'number' ? 'number' : 'text', placeholder: paramSchema.title || paramName, value: parameters[paramName] || '', onChange: (e) => handleParameterChange(paramName, e.target.value), className: error ? 'border-red-500' : '' })), error && (_jsxs("p", { className: "text-red-500 text-xs flex items-center gap-1", children: [_jsx(AlertCircle, { className: "h-3 w-3" }), error] }))] }, paramName));
                                    })] })), finalCommand && (_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "text-sm font-medium flex items-center gap-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-500" }), "\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430"] }), _jsx("div", { className: "p-3 bg-background border rounded-md", children: _jsx("code", { className: "text-sm break-all", children: finalCommand }) })] }))] })] }))] }));
};
