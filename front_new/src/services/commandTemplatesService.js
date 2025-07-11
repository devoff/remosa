import apiClient from './apiService';
class CommandTemplatesService {
    /**
     * Получить список шаблонов команд
     */
    async getTemplates(filters = {}) {
        const params = new URLSearchParams();
        if (filters.model)
            params.append('model', filters.model);
        if (filters.category)
            params.append('category', filters.category);
        if (filters.subcategory)
            params.append('subcategory', filters.subcategory);
        if (filters.skip)
            params.append('skip', filters.skip.toString());
        if (filters.limit)
            params.append('limit', filters.limit.toString());
        const response = await apiClient.get(`/api/v1/command_templates/?${params.toString()}`);
        return response.data;
    }
    /**
     * Получить список категорий команд
     */
    async getCategories() {
        const response = await apiClient.get('/api/v1/command_templates/categories');
        return response.data;
    }
    /**
     * Получить список подкатегорий команд
     */
    async getSubcategories(category) {
        const params = new URLSearchParams();
        if (category)
            params.append('category', category);
        const response = await apiClient.get(`/api/v1/command_templates/subcategories?${params.toString()}`);
        return response.data;
    }
    /**
     * Получить шаблоны команд для конкретного устройства
     */
    async getTemplatesByDevice(deviceId) {
        const response = await apiClient.get(`/api/v1/command_templates/by-device/${deviceId}`);
        return response.data;
    }
    /**
     * Получить шаблон команды по ID
     */
    async getTemplate(templateId) {
        const response = await apiClient.get(`/api/v1/command_templates/${templateId}`);
        return response.data;
    }
    /**
     * Получить шаблоны команд по модели устройства
     */
    async getTemplatesByModel(model) {
        return this.getTemplates({ model });
    }
    /**
     * Получить шаблоны команд по категории
     */
    async getTemplatesByCategory(category) {
        return this.getTemplates({ category });
    }
    /**
     * Получить шаблоны команд по категории и подкатегории
     */
    async getTemplatesByCategoryAndSubcategory(category, subcategory) {
        return this.getTemplates({ category, subcategory });
    }
}
export default new CommandTemplatesService();
