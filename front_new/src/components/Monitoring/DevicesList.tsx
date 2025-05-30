import { useState, useEffect } from 'react';
import './DevicesList.css';
import { useDevicesAPI } from './useDevicesAPI';
import { DeviceFormModal } from './DeviceFormModal';

interface Device {
  id: number;
  name: string;
  phone: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  description?: string;
  last_update: string;
  created_at: string;
  type?: 'sensor' | 'actuator' | 'controller'; // Добавим тип устройства
}

const DevicesList = () => {
  const { fetchDevices, deleteDevice, saveDevice } = useDevicesAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDevices();
        setDevices(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'text-green-500';
      case 'WARNING': return 'text-yellow-500';
      case 'OFFLINE': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDeviceIcon = (type?: string) => {
    const icons = {
      sensor: '🌡️',
      actuator: '⚙️',
      controller: '🖥️',
      default: '❓'
    };
    return icons[type as keyof typeof icons] || icons.default;
  };

  const handleDelete = async (id: string) => {
    await deleteDevice(id);
    setDevices(devices.filter(d => d.id !== id));
  };

  const handleSave = async (deviceData: Device) => {
    try {
      await saveDevice(deviceData);
      const updatedDevices = await fetchDevices();
      setDevices(updatedDevices);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  };

  if (loading) return <div className="p-4 text-center">Загрузка устройств...</div>;
  if (error) return <div className="p-4 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="devices-container p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Список устройств</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-400'}`}
          >
            Плитки
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-400'}`}
          >
            Таблица
          </button>
          <button onClick={() => setIsAddModalOpen(true)}>Добавить устройство</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <div key={device.id} className="device-card bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-gray-100">{device.name}</h3>
                  <div className="mt-2 space-y-1">
                    <p className="dark:text-gray-300">
                      Статус: <span className={`${getStatusColor(device.status)} font-medium`}>
                        {device.status}
                      </span>
                    </p>
                    <p className="dark:text-gray-300">ID: {device.id}</p>
                    {device.description && (
                      <p className="text-gray-600 dark:text-gray-400">Описание: {device.description}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Обновлено: {new Date(device.last_update).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-2 space-x-2">
                <button 
                  className="device-action-btn"
                  onClick={() => {
                    setCurrentDevice(device);
                    setIsEditModalOpen(true);
                  }}
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-gray-100">Устройство</th>
                <th className="px-4 py-2 text-left text-gray-100">Статус</th>
                <th className="px-4 py-2 text-left text-gray-100">ID</th>
                <th className="px-4 py-2 text-left text-gray-100">Описание</th>
                <th className="px-4 py-2 text-left text-gray-100">Обновлено</th>
                <th className="px-4 py-2 text-left text-gray-100">Действия</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-100">
                    <div className="flex items-center">
                      <span className="mr-2">{getDeviceIcon(device.type)}</span>
                      {device.name}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${getStatusColor(device.status)}`}>
                    {device.status}
                  </td>
                  <td className="px-4 py-3 text-gray-100">{device.id}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {device.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(device.last_update).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-100">
                    <div className="flex gap-2">
                      <button 
                        className="device-action-btn"
                        onClick={() => {
                          setCurrentDevice(device);
                          setIsEditModalOpen(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(device.id.toString())}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isEditModalOpen && (
        <DeviceFormModal 
          device={currentDevice}
          onSave={handleSave}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {isAddModalOpen && (
        <DeviceFormModal
          device={null}
          onSave={handleSave}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DevicesList;