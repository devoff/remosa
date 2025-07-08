import apiClient from './apiService';

export interface MonitoringMetric {
  id: number;
  technical_name: string;
  human_name: string;
  description?: string;
  unit?: string;
  category: string;
  data_type: string;
  min_value?: string;
  max_value?: string;
  is_active: boolean;
}

export interface MonitoringMetricsFilters {
  category?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

class MonitoringMetricsService {
  /**
   * Получить список метрик мониторинга
   */
  async getMetrics(filters: MonitoringMetricsFilters = {}): Promise<MonitoringMetric[]> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get(`/monitoring-metrics/?${params.toString()}`);
    return response.data;
  }

  /**
   * Получить список категорий метрик
   */
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/monitoring-metrics/categories');
    return response.data;
  }

  /**
   * Получить метрику по ID
   */
  async getMetric(metricId: number): Promise<MonitoringMetric> {
    const response = await apiClient.get(`/monitoring-metrics/${metricId}`);
    return response.data;
  }

  /**
   * Получить метрики по категории
   */
  async getMetricsByCategory(category: string): Promise<MonitoringMetric[]> {
    return this.getMetrics({ category, is_active: true });
  }

  /**
   * Получить активные метрики
   */
  async getActiveMetrics(): Promise<MonitoringMetric[]> {
    return this.getMetrics({ is_active: true });
  }
}

export default new MonitoringMetricsService(); 