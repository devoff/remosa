import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '../NotificationProvider';
import { usePlatformExporterApi } from '../../lib/platformExporterApi';
const PlatformExporterDialog = ({ platformId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [exporterType, setExporterType] = useState('cubicmedia');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        api_endpoint: '',
        mac_addresses: '',
        api_key: '',
        polling_interval: 30,
        timeout: 15,
        retry_count: 3,
        cache_enabled: true
    });
    const { notify } = useNotification();
    const { createPlatformExporter } = usePlatformExporterApi();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            notify('Введите название экспортера', 'error');
            return;
        }
        if (exporterType === 'cubicmedia' && !formData.mac_addresses.trim()) {
            notify('Введите MAC-адреса для CubicMedia экспортера', 'error');
            return;
        }
        if (exporterType === 'addreality' && !formData.api_key.trim()) {
            notify('Введите API ключ для Addreality экспортера', 'error');
            return;
        }
        try {
            setLoading(true);
            // Подготавливаем данные конфигурации
            const config = {
                polling_interval: formData.polling_interval,
                timeout: formData.timeout,
                retry_count: formData.retry_count,
                cache_enabled: formData.cache_enabled
            };
            if (exporterType === 'cubicmedia') {
                config.api_endpoint = formData.api_endpoint || 'https://vision-cms-api.cubicservice.ru/api/v0.1/players/status-check?mac=';
                config.mac_addresses = formData.mac_addresses
                    .split('\n')
                    .map(mac => mac.trim())
                    .filter(mac => mac.length > 0);
            }
            else {
                config.api_key = formData.api_key;
                config.api_endpoint = formData.api_endpoint;
            }
            const exporterData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                platform_type: exporterType,
                config
            };
            await createPlatformExporter(platformId, exporterData);
            notify('Экспортер успешно создан', 'success');
            onSuccess();
        }
        catch (error) {
            console.error('Ошибка создания экспортера:', error);
            notify(error.response?.data?.detail || 'Ошибка создания экспортера', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-100", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-300 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "name", className: "text-gray-300", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430 *" }), _jsx(Input, { id: "name", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), placeholder: "\u041C\u043E\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", className: "text-gray-300", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), placeholder: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430", className: "mt-1", rows: 3 })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "exporter_type", className: "text-gray-300", children: "\u0422\u0438\u043F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430 *" }), _jsxs(Select, { value: exporterType, onValueChange: (value) => setExporterType(value), children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "cubicmedia", children: "CubicMedia (MAC-\u0430\u0434\u0440\u0435\u0441\u0430)" }), _jsx(SelectItem, { value: "addreality", children: "Addreality (API \u043A\u043B\u044E\u0447)" })] })] })] })] }), _jsxs("div", { className: "border-t border-gray-700 pt-6", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center gap-2", children: [_jsx(Settings, { size: 18 }), "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 ", exporterType === 'cubicmedia' ? 'CubicMedia' : 'Addreality'] }), exporterType === 'cubicmedia' ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "api_endpoint", className: "text-gray-300", children: "API Endpoint" }), _jsx(Input, { id: "api_endpoint", value: formData.api_endpoint, onChange: (e) => handleInputChange('api_endpoint', e.target.value), placeholder: "https://vision-cms-api.cubicservice.ru/api/v0.1/players/status-check?mac=", className: "mt-1" }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u043E\u0433\u043E endpoint" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "mac_addresses", className: "text-gray-300", children: "MAC-\u0430\u0434\u0440\u0435\u0441\u0430 *" }), _jsx(Textarea, { id: "mac_addresses", value: formData.mac_addresses, onChange: (e) => handleInputChange('mac_addresses', e.target.value), placeholder: "06:42:40:92:60:B4\n06:42:40:92:60:B5\n06:42:40:92:60:B6", className: "mt-1", rows: 5, required: true }), _jsx("p", { className: "text-gray-500 text-sm mt-1", children: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 MAC-\u0430\u0434\u0440\u0435\u0441\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432, \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0443" })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "api_key", className: "text-gray-300", children: "API \u043A\u043B\u044E\u0447 *" }), _jsx(Input, { id: "api_key", type: "password", value: formData.api_key, onChange: (e) => handleInputChange('api_key', e.target.value), placeholder: "\u0412\u0430\u0448 API \u043A\u043B\u044E\u0447", className: "mt-1", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "addreality_api_endpoint", className: "text-gray-300", children: "API Endpoint" }), _jsx(Input, { id: "addreality_api_endpoint", value: formData.api_endpoint, onChange: (e) => handleInputChange('api_endpoint', e.target.value), placeholder: "https://api.addreality.com/v1", className: "mt-1" })] })] }))] }), _jsxs("div", { className: "border-t border-gray-700 pt-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-100 mb-4", children: "\u041E\u0431\u0449\u0438\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "polling_interval", className: "text-gray-300", children: "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u043E\u043F\u0440\u043E\u0441\u0430 (\u0441\u0435\u043A)" }), _jsx(Input, { id: "polling_interval", type: "number", value: formData.polling_interval, onChange: (e) => handleInputChange('polling_interval', parseInt(e.target.value)), min: 10, max: 300, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "timeout", className: "text-gray-300", children: "\u0422\u0430\u0439\u043C\u0430\u0443\u0442 (\u0441\u0435\u043A)" }), _jsx(Input, { id: "timeout", type: "number", value: formData.timeout, onChange: (e) => handleInputChange('timeout', parseInt(e.target.value)), min: 5, max: 60, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "retry_count", className: "text-gray-300", children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A" }), _jsx(Input, { id: "retry_count", type: "number", value: formData.retry_count, onChange: (e) => handleInputChange('retry_count', parseInt(e.target.value)), min: 1, max: 10, className: "mt-1" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-6 border-t border-gray-700", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: loading, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsxs(Button, { type: "submit", disabled: loading, className: "flex items-center gap-2", children: [loading ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" })) : (_jsx(Save, { size: 16 })), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440"] })] })] })] }) }));
};
export default PlatformExporterDialog;
