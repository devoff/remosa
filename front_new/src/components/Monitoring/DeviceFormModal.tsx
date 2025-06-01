import React, { useState } from 'react';
import { Device } from '../../types';
import { Select } from 'antd';

interface DeviceFormModalProps {
  device: Device | null;
  onSave: (data: Device) => void;
  onClose: () => void;
  availableModels: string[];
}

export const DeviceFormModal = ({ device, onSave, onClose, availableModels }: DeviceFormModalProps) => {
  const [formData, setFormData] = useState<Partial<Device>>(device || {
    name: '',
    phone: '',
    description: '',
    status: 'ONLINE',
    model: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Device);
    onClose();
  };

  // Общие классы для полей ввода и выбора
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
        width: '400px',
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
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              pattern="\+?[0-9\s\-\(\)]+"
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="grafana_player_id" className="text-gray-700 dark:text-gray-300 mb-1">ID плеера Grafana</label>
            <input
              id="grafana_player_id"
              className={inputClasses}
              value={formData.grafana_uid || ''}
              onChange={(e) => setFormData({...formData, grafana_uid: e.target.value})}
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="model" className="text-gray-700 dark:text-gray-300 mb-1">Модель</label>
            <Select
              id="model"
              value={formData.model}
              onChange={(value) => setFormData({...formData, model: value})}
              options={availableModels.map(model => ({ label: model, value: model }))}
              placeholder="Выберите модель"
              className={inputClasses}
              styles={{
                popup: {
                  root: { backgroundColor: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px' }
                },
              }}
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group flex flex-col">
            <label htmlFor="description" className="text-gray-700 dark:text-gray-300 mb-1">Описание</label>
            <textarea
              id="description"
              className={`${inputClasses} h-24`}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
