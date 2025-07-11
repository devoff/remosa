import apiClient from './apiService';
class MonitoringMetricsService {
    /**
     * Получить список метрик мониторинга
     */
    async getMetrics(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category)
            params.append('category', filters.category);
        if (filters.is_active !== undefined)
            params.append('is_active', filters.is_active.toString());
        if (filters.skip)
            params.append('skip', filters.skip.toString());
        if (filters.limit)
            params.append('limit', filters.limit.toString());
        const response = await apiClient.get(`/monitoring-metrics/?${params.toString()}`);
        return response.data;
    }
    /**
     * Получить список категорий метрик
     */
    async getCategories() {
        const response = await apiClient.get('/monitoring-metrics/categories');
        return response.data;
    }
    /**
     * Получить метрику по ID
     */
    async getMetric(metricId) {
        const response = await apiClient.get(`/monitoring-metrics/${metricId}`);
        return response.data;
    }
    /**
     * Получить метрики по категории
     */
    async getMetricsByCategory(category) {
        return this.getMetrics({ category, is_active: true });
    }
    /**
     * Получить активные метрики
     */
    async getActiveMetrics() {
        return this.getMetrics({ is_active: true });
    }
}
export default new MonitoringMetricsService();
