import { Device } from '../../types';
import apiClient from '../../lib/api';

export const useDevicesAPI = () => {
  const fetchDevices = async () => {
    const response = await apiClient.get('/devices/');
    return response.data;
  };

  const deleteDevice = async (id: string) => {
    await apiClient.delete(`/devices/${id}`);
  };

  const saveDevice = async (deviceData: Device) => {
    if (deviceData.phone && !/^\+?[0-9\s\-\(\)]+$/.test(deviceData.phone)) {
      throw new Error('Неверный формат телефона');
    }

    if (deviceData.id) {
      await apiClient.put(`/devices/${deviceData.id}`, deviceData);
    } else {
      await apiClient.post('/devices/', deviceData);
    }
  };

  return { fetchDevices, deleteDevice, saveDevice };
};
