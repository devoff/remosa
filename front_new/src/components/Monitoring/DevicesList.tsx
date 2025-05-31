import { useState, useEffect } from 'react';
import './DevicesList.css';
import { useDevicesAPI } from './useDevicesAPI';
import { DeviceFormModal } from './DeviceFormModal';
import { DeviceCommandsPanel } from '../DeviceCommandsPanel';
import { CommandTemplate, Device } from '../../types';

const DevicesList = () => {
  const { fetchDevices, deleteDevice, saveDevice } = useDevicesAPI();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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
    setDevices(devices.filter((d: Device) => String(d.id) !== String(id)));
  };

  const handleSave = async (deviceData: Device) => {
    try {
      await saveDevice({
        ...deviceData,
        id: String(deviceData.id)
      });
      const updatedDevices = await fetchDevices();
      setDevices(updatedDevices);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  };

  const handleOpenCommandsPanel = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleCloseCommandsPanel = () => {
    setSelectedDevice(null);
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
          <button onClick={() => setIsAddModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">Добавить устройство</button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device: Device) => (
            <div key={device.id} className="device-card bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">
                  {getDeviceIcon(device.model)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium dark:text-gray-100">{device.name}</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setCurrentDevice(device);
                          setIsEditModalOpen(true);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(device.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleOpenCommandsPanel(device)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        ⚙️ Команды
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="dark:text-gray-300">
                      Статус: <span className={`${getStatusColor(device.status)} font-medium`}>
                        {device.status}
                      </span>
                    </p>
                    <p className="dark:text-gray-300">ID: {device.id}</p>
                    {device.phone && (
                      <p className="dark:text-gray-300">Телефон: {device.phone}</p>
                    )}
                    {device.description && (
                      <p className="text-gray-600 dark:text-gray-400">Описание: {device.description}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Обновлено: {new Date(device.last_update).toLocaleString()}
                    </p>
                  </div>
                </div>
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
                <th className="px-4 py-2 text-left text-gray-100">Телефон</th>
                <th className="px-4 py-2 text-left text-gray-100">Описание</th>
                <th className="px-4 py-2 text-left text-gray-100">Обновлено</th>
                <th className="px-4 py-2 text-left text-gray-100">Действия</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device: Device) => (
                <tr key={device.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-100">
                    <div className="flex items-center">
                      <span className="mr-2">{getDeviceIcon(device.model)}</span>
                      {device.name}
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${getStatusColor(device.status)}`}>
                    {device.status}
                  </td>
                  <td className="px-4 py-3 text-gray-100">{device.id}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {device.phone || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {device.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(device.last_update).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-100">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setCurrentDevice(device);
                          setIsEditModalOpen(true);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(device.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => handleOpenCommandsPanel(device)}
                        className="text-blue-500 hover:text-blue-700 ml-2"
                      >
                        ⚙️ Команды
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAddModalOpen && (
        <DeviceFormModal
          device={null}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {isEditModalOpen && (
        <DeviceFormModal
          device={currentDevice}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseCommandsPanel}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
            <DeviceCommandsPanel device={selectedDevice} onClose={handleCloseCommandsPanel} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesList;