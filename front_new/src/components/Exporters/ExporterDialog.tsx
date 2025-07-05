import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../../lib/exporterApi';
import { ExporterFormData, Exporter } from '../../types/exporter';
import { useNotification } from '../NotificationProvider';

interface ExporterDialogProps {
  exporter?: Exporter;
  onClose: () => void;
  onSave: () => void;
}

const ExporterDialog: React.FC<ExporterDialogProps> = ({ 
  exporter, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<ExporterFormData>({
    name: '',
    platform_type: 'cubicmedia',
    mac_addresses: [],
    platform_id: '',
    is_active: true
  });
  const [macInput, setMacInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [macPage, setMacPage] = useState(1);
  const [macsPerPage] = useState(20);
  const [allMacs, setAllMacs] = useState<string[]>([]);

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
      } else {
        setApiKey('');
        setTags([]);
      }
      getExporterMacs(exporter.id).then(setAllMacs);
    } else {
      setAllMacs([]);
    }
  }, [exporter]);

  useEffect(() => {
    if (formData.platform_type === 'cubicmedia') {
      setApiKey('');
      setTags([]);
    } else if (formData.platform_type === 'addreality') {
      setFormData(prev => ({ ...prev, mac_addresses: [] }));
      setMacInput('');
    }
  }, [formData.platform_type]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
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
    } else if (formData.platform_type === 'addreality') {
      if (!apiKey.trim()) {
        newErrors.api_key = 'API-ключ обязателен';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      let payload = { ...formData };
      if (formData.platform_type === 'addreality') {
        payload.api_key = apiKey;
        payload.tags = tags;
        payload.mac_addresses = [];
      }
      if (exporter) {
        await updateExporter(exporter.id, payload);
        if (formData.platform_type === 'cubicmedia') {
          await replaceExporterMacs(exporter.id, formData.mac_addresses);
        }
        notify('Экспортер обновлен', 'success');
      } else {
        await createExporter(payload);
        notify('Экспортер создан', 'success');
      }
      onSave();
    } catch (error) {
      notify('Ошибка при сохранении', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMacs = async (macs: string[]) => {
    if (!exporter) return;
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

  const removeMacAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mac_addresses: prev.mac_addresses.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOne();
    }
  };

  const totalPages = Math.ceil(allMacs.length / macsPerPage);
  const paginatedMacs = allMacs.slice((macPage - 1) * macsPerPage, macPage * macsPerPage);
  const handleRemoveMac = async (mac: string) => {
    if (!exporter) return;
    await removeExporterMacs(exporter.id, [mac]);
    setAllMacs(prev => prev.filter(m => m !== mac));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">
              {exporter ? 'Редактировать экспортер' : 'Добавить экспортер'}
            </h2>
            {exporter && (
              <span className="text-sm text-gray-400 ml-4">ID: {exporter.id}</span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название экспортера *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:outline-none`}
                placeholder="Введите название экспортера"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Тип платформы */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Тип платформы *
              </label>
              <select
                value={formData.platform_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  platform_type: e.target.value as 'cubicmedia' | 'addreality' 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                disabled={!!exporter}
              >
                <option value="cubicmedia">CubicMedia</option>
                <option value="addreality">Addreality</option>
              </select>
            </div>

            {/* Platform ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform ID *
              </label>
              <input
                type="text"
                value={formData.platform_id}
                onChange={(e) => setFormData(prev => ({ ...prev, platform_id: e.target.value }))}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${
                  errors.platform_id ? 'border-red-500' : 'border-gray-600'
                } focus:border-blue-500 focus:outline-none`}
                placeholder="Введите Platform ID"
              />
              {errors.platform_id && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.platform_id}
                </p>
              )}
            </div>

            {/* MAC-адреса или API-ключ/теги */}
            {formData.platform_type === 'cubicmedia' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MAC-адреса устройств *
                </label>
                <div className="space-y-3">
                  {/* Массовый ввод */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Массовый ввод (по одному на строку)
                    </label>
                    <textarea
                      value={macInput}
                      onChange={(e) => setMacInput(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                      placeholder="00:11:22:33:44:55&#10;AA:BB:CC:DD:EE:FF&#10;12:34:56:78:9A:BC"
                      rows={4}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleAddAll}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Добавить все
                      </button>
                      <button
                        type="button"
                        onClick={() => setMacInput('')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Очистить
                      </button>
                    </div>
                  </div>
                  {/* Одиночный ввод */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Добавить один MAC-адрес
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={macInput}
                        onChange={(e) => setMacInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                        placeholder="00:11:22:33:44:55"
                      />
                      <button
                        type="button"
                        onClick={handleAddOne}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                </div>
                {errors.mac_addresses && (
                  <p className="text-red-400 text-sm mb-2 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.mac_addresses}
                  </p>
                )}
                {/* Список MAC-адресов с пагинацией */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">
                      Всего: {allMacs.length}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex gap-2">
                        <button disabled={macPage === 1} onClick={() => setMacPage(macPage - 1)} className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50">Назад</button>
                        <span className="text-gray-300">{macPage} / {totalPages}</span>
                        <button disabled={macPage === totalPages} onClick={() => setMacPage(macPage + 1)} className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50">Вперёд</button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {paginatedMacs.map((mac, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                        <span className="text-gray-300 font-mono text-sm">{mac}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMac(mac)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {paginatedMacs.length === 0 && <span className="text-gray-400">Нет MAC-адресов</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API-ключ *
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-gray-100 ${errors.api_key ? 'border-red-500' : 'border-gray-600'} focus:border-blue-500 focus:outline-none`}
                  placeholder="Введите API-ключ"
                />
                {errors.api_key && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.api_key}
                  </p>
                )}
                {/* Теги */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Теги
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          if (!tags.includes(tagInput.trim())) {
                            setTags([...tags, tagInput.trim()]);
                          }
                          setTagInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                      placeholder="Введите тег и нажмите Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                          setTags([...tags, tagInput.trim()]);
                        }
                        setTagInput('');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-600 text-gray-100 px-2 py-1 rounded flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Активность */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                Экспортер активен
              </label>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Сохранение...' : (exporter ? 'Обновить' : 'Создать')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExporterDialog; 