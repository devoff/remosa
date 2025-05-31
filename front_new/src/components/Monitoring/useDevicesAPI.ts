import { Device } from '../../types';

export const useDevicesAPI = () => {
  const fetchDevices = async () => {
    const res = await fetch('/api/v1/devices/');
    return await res.json();
  };

  const deleteDevice = async (id: string) => {
    await fetch(`/api/v1/devices/${id}`, { method: 'DELETE' });
  };

  const saveDevice = async (deviceData: Device) => {
    if (deviceData.phone && !/^\+?[0-9\s\-\(\)]+$/.test(deviceData.phone)) {
      throw new Error('Неверный формат телефона');
    }

    const method = deviceData.id ? 'PUT' : 'POST';
    const url = deviceData.id 
      ? `/api/v1/devices/${deviceData.id}`
      : '/api/v1/devices/';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
  };

  return { fetchDevices, deleteDevice, saveDevice };
};
