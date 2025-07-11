import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useExporterApi } from '../../lib/exporterApi';
import { useNotification } from '../NotificationProvider';
const ExporterDialog = ({ exporter, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        platform_type: 'cubicmedia',
        mac_addresses: [],
        platform_id: '',
        is_active: true
    });
    const [macInput, setMacInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiKey, setApiKey] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [macPage, setMacPage] = useState(1);
    const [macsPerPage] = useState(20);
    const [allMacs, setAllMacs] = useState([]);
    const { createExporter, updateExporter, replaceExporterMacs, getExporterMacs, removeExporterMacs, addExporterMacs } = useExporterApi();
    const { notify } = useNotification();
    useEffect(() => {
        if (exporter) {
            const macs = Array.isArray(exporter.mac_addresses) ? exporter.mac_addresses : [];
            setFormData({
                name: exporter.name,
                platform_type: exporter.platform_type,
                mac_addresses: macs,
                platform_id: String(exporter.platform_id),
                is_active: exporter.is_active,
                api_key: exporter.api_key || '',
                tags: exporter.tags || [],
            });
            setMacInput(macs.join('\n'));
            if (exporter.platform_type === 'addreality') {
                setApiKey(exporter.api_key || '');
                setTags(exporter.tags || []);
            }
            else {
                setApiKey('');
                setTags([]);
            }
            getExporterMacs(exporter.id).then(setAllMacs);
        }
        else {
            setAllMacs([]);
        }
    }, [exporter]);
    useEffect(() => {
        if (formData.platform_type === 'cubicmedia') {
            setApiKey('');
            setTags([]);
        }
        else if (formData.platform_type === 'addreality') {
            setFormData(prev => ({ ...prev, mac_addresses: [] }));
            setMacInput('');
        }
    }, [formData.platform_type]);
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Название обязательно';
        }
        if (!formData.platform_id.trim()) {
            newErrors.platform_id = 'Platform ID обязателен';
        }
        if (formData.platform_type === 'cubicmedia') {
            if (!(Array.isArray(formData.mac_addresses) && formData.mac_addresses.length > 0)) {
                newErrors.mac_addresses = 'Добавьте хотя бы один MAC-адрес';
            }
        }
        else if (formData.platform_type === 'addreality') {
            if (!apiKey.trim()) {
                newErrors.api_key = 'API-ключ обязателен';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setLoading(true);
            let payload;
            if (formData.platform_type === 'addreality') {
                payload = {
                    name: formData.name,
                    platform_type: formData.platform_type,
                    platform_id: formData.platform_id,
                    is_active: formData.is_active,
                    config: {
                        api_key: apiKey,
                        tags: tags,
                    }
                };
            }
            else {
                payload = {
                    ...formData,
                };
            }
            if (exporter) {
                await updateExporter(exporter.id, payload);
                if (formData.platform_type === 'cubicmedia') {
                    await replaceExporterMacs(exporter.id, formData.mac_addresses);
                }
                notify('Экспортер обновлен', 'success');
            }
            else {
                await createExporter(payload);
                notify('Экспортер создан', 'success');
            }
            onSave();
        }
        catch (error) {
            notify('Ошибка при сохранении', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAddMacs = async (macs) => {
        if (!exporter)
            return;
        const uniqueMacs = macs.filter(mac => !allMacs.includes(mac));
        if (uniqueMacs.length === 0) {
            notify('Все MAC-адреса уже существуют', 'warning');
            return;
        }
        await addExporterMacs(exporter.id, uniqueMacs);
        setAllMacs(prev => [...prev, ...uniqueMacs]);
        setMacInput('');
        notify('MAC-адреса добавлены', 'success');
    };
    const handleAddAll = () => {
        const macs = macInput.split('\n').map(mac => mac.trim().toUpperCase()).filter(mac => mac);
        const validMacs = macs.filter(mac => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac));
        handleAddMacs(validMacs);
    };
    const handleAddOne = () => {
        const mac = macInput.trim().toUpperCase();
        if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) {
            notify('Некорректный MAC-адрес', 'warning');
            return;
        }
        handleAddMacs([mac]);
    };
    const removeMacAddress = (index) => {
        setFormData(prev => ({
            ...prev,
            mac_addresses: prev.mac_addresses.filter((_, i) => i !== index)
        }));
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddOne();
        }
    };
    const totalPages = Math.ceil(allMacs.length / macsPerPage);
    const paginatedMacs = allMacs.slice((macPage - 1) * macsPerPage, macPage * macsPerPage);
    const handleRemoveMac = async (mac) => {
        if (!exporter)
            return;
        await removeExporterMacs(exporter.id, [mac]);
        setAllMacs(prev => prev.filter(m => m !== mac));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-100", children: exporter ? 'Редактировать экспортер' : 'Добавить экспортер' }), exporter && (_jsxs("span", { className: "text-sm text-gray-400 ml-4", children: ["ID: ", exporter.id] })), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430 *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })), className: `w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${errors.name ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430" }), errors.name && (_jsxs("p", { className: "text-red-400 text-sm mt-1 flex items-center", children: [_jsx(AlertCircle, { size: 14, className: "mr-1" }), errors.name] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "\u0422\u0438\u043F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B *" }), _jsxs("select", { value: formData.platform_type, onChange: (e) => setFormData(prev => ({
                                            ...prev,
                                            platform_type: e.target.value
                                        })), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none", disabled: !!exporter, children: [_jsx("option", { value: "cubicmedia", children: "CubicMedia" }), _jsx("option", { value: "addreality", children: "Addreality" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Platform ID *" }), _jsx("input", { type: "text", value: formData.platform_id, onChange: (e) => setFormData(prev => ({ ...prev, platform_id: e.target.value })), className: `w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${errors.platform_id ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 Platform ID" }), errors.platform_id && (_jsxs("p", { className: "text-red-400 text-sm mt-1 flex items-center", children: [_jsx(AlertCircle, { size: 14, className: "mr-1" }), errors.platform_id] }))] }), formData.platform_type === 'cubicmedia' ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "MAC-\u0430\u0434\u0440\u0435\u0441\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 *" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-400 mb-1", children: "\u041C\u0430\u0441\u0441\u043E\u0432\u044B\u0439 \u0432\u0432\u043E\u0434 (\u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0443)" }), _jsx("textarea", { value: macInput, onChange: (e) => setMacInput(e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none", placeholder: "00:11:22:33:44:55\nAA:BB:CC:DD:EE:FF\n12:34:56:78:9A:BC", rows: 4 }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx("button", { type: "button", onClick: handleAddAll, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0441\u0435" }), _jsx("button", { type: "button", onClick: () => setMacInput(''), className: "px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors", children: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-400 mb-1", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043E\u0434\u0438\u043D MAC-\u0430\u0434\u0440\u0435\u0441" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: macInput, onChange: (e) => setMacInput(e.target.value), onKeyPress: handleKeyPress, className: "flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none", placeholder: "00:11:22:33:44:55" }), _jsx("button", { type: "button", onClick: handleAddOne, className: "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] })] })] }), errors.mac_addresses && (_jsxs("p", { className: "text-red-400 text-sm mb-2 flex items-center", children: [_jsx(AlertCircle, { size: 14, className: "mr-1" }), errors.mac_addresses] })), _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("span", { className: "text-sm text-gray-400", children: ["\u0412\u0441\u0435\u0433\u043E: ", allMacs.length] }), totalPages > 1 && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { disabled: macPage === 1, onClick: () => setMacPage(macPage - 1), className: "px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50", children: "\u041D\u0430\u0437\u0430\u0434" }), _jsxs("span", { className: "text-gray-300", children: [macPage, " / ", totalPages] }), _jsx("button", { disabled: macPage === totalPages, onClick: () => setMacPage(macPage + 1), className: "px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50", children: "\u0412\u043F\u0435\u0440\u0451\u0434" })] }))] }), _jsxs("div", { className: "max-h-40 overflow-y-auto space-y-2", children: [paginatedMacs.map((mac, index) => (_jsxs("div", { className: "flex items-center justify-between bg-gray-700 p-2 rounded", children: [_jsx("span", { className: "text-gray-300 font-mono text-sm", children: mac }), _jsx("button", { type: "button", onClick: () => handleRemoveMac(mac), className: "text-red-400 hover:text-red-300 transition-colors", children: _jsx(X, { size: 16 }) })] }, index))), paginatedMacs.length === 0 && _jsx("span", { className: "text-gray-400", children: "\u041D\u0435\u0442 MAC-\u0430\u0434\u0440\u0435\u0441\u043E\u0432" })] })] })] })) : (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "API-\u043A\u043B\u044E\u0447 *" }), _jsx("input", { type: "text", value: apiKey, onChange: e => setApiKey(e.target.value), className: `w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${errors.api_key ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 API-\u043A\u043B\u044E\u0447" }), errors.api_key && (_jsxs("p", { className: "text-red-400 text-sm mt-1 flex items-center", children: [_jsx(AlertCircle, { size: 14, className: "mr-1" }), errors.api_key] })), _jsxs("div", { className: "mt-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "\u0422\u0435\u0433\u0438" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: tagInput, onChange: e => setTagInput(e.target.value), onKeyDown: e => {
                                                            if (e.key === 'Enter' && tagInput.trim()) {
                                                                e.preventDefault();
                                                                if (!tags.includes(tagInput.trim())) {
                                                                    setTags([...tags, tagInput.trim()]);
                                                                }
                                                                setTagInput('');
                                                            }
                                                        }, className: "flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u0433 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Enter" }), _jsx("button", { type: "button", onClick: () => {
                                                            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                                setTags([...tags, tagInput.trim()]);
                                                            }
                                                            setTagInput('');
                                                        }, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((tag, idx) => (_jsxs("span", { className: "bg-gray-600 text-gray-100 px-2 py-1 rounded flex items-center gap-1", children: [tag, _jsx("button", { type: "button", onClick: () => setTags(tags.filter((_, i) => i !== idx)), className: "text-red-400 hover:text-red-300 ml-1", children: _jsx(X, { size: 12 }) })] }, idx))) })] })] })), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => setFormData(prev => ({ ...prev, is_active: e.target.checked })), className: "w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 text-sm text-gray-300", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440 \u0430\u043A\u0442\u0438\u0432\u0435\u043D" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsxs("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50", children: [_jsx(Save, { size: 16 }), loading ? 'Сохранение...' : (exporter ? 'Обновить' : 'Создать')] })] })] })] }) }) }));
};
export default ExporterDialog;
