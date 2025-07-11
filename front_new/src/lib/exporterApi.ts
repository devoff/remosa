import { useApi } from './useApi';
// Импортируйте нужные типы: Exporter, ExporterFormData, ExporterMetrics, Device, Job, JobFormData, JobExecution, PrometheusDevice, ManagementDevice, DeviceMetrics, ExporterStats

export const useExporterApi = () => {
  const { get, post, put, remove } = useApi();

  // Экспортеры
  const getExporters = async (): Promise<any[]> => {
    return await get('/exporters/');
  };

  const getExporter = async (id: number): Promise<any> => {
    return await get(`/exporters/${id}`);
  };

  const createExporter = async (data: any): Promise<any> => {
    return await post('/exporters/', data);
  };

  const updateExporter = async (id: number, data: Partial<any>): Promise<any> => {
    return await put(`/exporters/${id}`, data);
  };

  const deleteExporter = async (id: number): Promise<void> => {
    return await remove(`/exporters/${id}`);
  };

  const syncExporter = async (id: number): Promise<void> => {
    return await post(`/exporters/${id}/sync`);
  };

  const getExporterMetrics = async (id: number): Promise<any> => {
    return await get(`/exporters/${id}/metrics`);
  };

  const getExporterDevices = async (id: number): Promise<any[]> => {
    return await get(`/exporters/${id}/devices`);
  };

  // Задания
  const getJobs = async (): Promise<any[]> => {
    return await get('/jobs/');
  };

  const getJob = async (id: number): Promise<any> => {
    return await get(`/jobs/${id}`);
  };

  const createJob = async (data: any): Promise<any> => {
    return await post('/jobs/', data);
  };

  const updateJob = async (id: number, data: Partial<any>): Promise<any> => {
    return await put(`/jobs/${id}`, data);
  };

  const deleteJob = async (id: number): Promise<void> => {
    return await remove(`/jobs/${id}`);
  };

  const executeJob = async (id: number): Promise<void> => {
    return await post(`/jobs/${id}/execute`);
  };

  const getJobExecutions = async (jobId: number): Promise<any[]> => {
    return await get(`/jobs/${jobId}/executions`);
  };

  // Prometheus интеграция
  const getPrometheusDevices = async (platformId?: number): Promise<any[]> => {
    const params = platformId ? `?platform_id=${platformId}` : '';
    return await get(`/jobs/devices-prometheus${params}`);
  };

  const getManagementDevices = async (platformId?: number): Promise<any[]> => {
    const params = platformId ? `?platform_id=${platformId}` : '';
    return await get(`/jobs/devices-management${params}`);
  };

  const getDeviceMetrics = async (deviceMac: string): Promise<any> => {
    return await get(`/jobs/prometheus/metrics/${deviceMac}`);
  };

  const generateJobName = async (
    deviceMac: string, 
    metricName: string, 
    operator: string, 
    thresholdValue: string
  ): Promise<{ name: string }> => {
    return await post('/jobs/generate-name', {
      device_mac: deviceMac,
      metric_name: metricName,
      operator: operator,
      threshold_value: thresholdValue
    });
  };

  const getDeviceCommandTemplates = async (deviceId: number): Promise<any[]> => {
    return await get(`/command_templates/by-device/${deviceId}`);
  };

  // Статистика
  const getExporterStats = async (): Promise<any> => {
    return await get('/exporters/stats');
  };

  // Устройства
  const getAllDevices = async (): Promise<any[]> => {
    try {
      return await get('/exporters/devices');
    } catch (e) {
      console.error('getAllDevices error:', e);
      return [];
    }
  };

  // MAC-адреса экспортеров
  const getExporterMacs = async (exporterId: number): Promise<string[]> => {
    return await get(`/exporters/${exporterId}/macs`);
  };

  const addExporterMacs = async (exporterId: number, macAddresses: string[]): Promise<any> => {
    return await post(`/exporters/${exporterId}/macs`, macAddresses);
  };

  const removeExporterMacs = async (exporterId: number, macAddresses: string[]): Promise<any> => {
    return await remove(`/exporters/${exporterId}/macs`, { data: macAddresses });
  };

  const replaceExporterMacs = async (exporterId: number, macAddresses: string[]): Promise<any> => {
    return await put(`/exporters/${exporterId}/macs`, macAddresses);
  };

  const getMacsForExporter = async (exporterId: number): Promise<any[]> => {
    return await get(`/exporters/macs/for-exporter/${exporterId}`);
  };

  return {
    // Экспортеры
    getExporters,
    getExporter,
    createExporter,
    updateExporter,
    deleteExporter,
    syncExporter,
    getExporterMetrics,
    getExporterDevices,
    // Задания
    getJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    executeJob,
    getJobExecutions,
    // Prometheus интеграция
    getPrometheusDevices,
    getManagementDevices,
    getDeviceMetrics,
    generateJobName,
    getDeviceCommandTemplates,
    // Статистика
    getExporterStats,
    // Устройства
    getAllDevices,
    // MAC-адреса
    getExporterMacs,
    addExporterMacs,
    removeExporterMacs,
    replaceExporterMacs,
    getMacsForExporter,
  };
}; 