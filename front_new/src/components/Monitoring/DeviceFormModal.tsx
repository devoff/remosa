import React, { useState } from 'react';

interface DeviceFormModalProps {
  device: Device | null;
  onSave: (data: Device) => void;
  onClose: () => void;
}

export const DeviceFormModal = ({ device, onSave, onClose }: DeviceFormModalProps) => {
  const [formData, setFormData] = useState<Partial<Device>>(device || {
    name: '',
    phone: '',
    description: '',
    status: 'ONLINE'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Device);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              pattern="\+?[0-9\s\-\(\)]+"
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-actions">
            <button type="submit">Сохранить</button>
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
        {device && device.phone && (
          <p className="text-gray-600 dark:text-gray-400">Телефон: {device.phone}</p>
        )}
      </div>
    </div>
  );
};
