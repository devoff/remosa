import apiClient from '../../lib/api';

export const useDevicesAPI = () => {
    const fetchDevices = async () => {
        const res = await apiClient.get('/devices');
        return res.data;
    };
    const deleteDevice = async (id) => {
        await apiClient.delete(`/devices/${id}`);
    };
    const saveDevice = async (deviceData) => {
        if (deviceData.phone && !/^\+?[0-9\s\-\(\)]+$/.test(deviceData.phone)) {
            throw new Error('Неверный формат телефона');
        }
        const method = deviceData.id ? 'put' : 'post';
        const url = deviceData.id
            ? `/devices/${deviceData.id}`
            : '/devices';
        await apiClient[method](url, deviceData);
    };
    return { fetchDevices, deleteDevice, saveDevice };
};
