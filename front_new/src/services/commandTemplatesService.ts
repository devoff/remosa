import apiClient from './apiService';

export interface CommandTemplate {
  id: number;
  model: string;
  category: string;
  subcategory?: string;
  name: string;
  template: string;
  description?: string;
  params_schema: {
    type: string;
    properties: { [key: string]: { type: string; title?: string; pattern?: string; enum?: any[]; }; };
    required?: string[];
  };
}

export interface CommandTemplatesFilters {
  model?: string;
  category?: string;
  subcategory?: string;
  skip?: number;
  limit?: number;
}

class CommandTemplatesService {
  /**
   * Получить список шаблонов команд
   */
  async getTemplates(filters: CommandTemplatesFilters = {}): Promise<CommandTemplate[]> {
    const params = new URLSearchParams();
    
    if (filters.model) params.append('model', filters.model);
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.skip) params.append('skip', filters.skip.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get(`/api/v1/command_templates/?${params.toString()}`);
    return response.data;
  }

  /**
   * Получить список категорий команд
   */
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get('/api/v1/command_templates/categories');
    return response.data;
  }

  /**
   * Получить список подкатегорий команд
   */
  async getSubcategories(category?: string): Promise<string[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const response = await apiClient.get(`/api/v1/command_templates/subcategories?${params.toString()}`);
    return response.data;
  }

  /**
   * Получить шаблоны команд для конкретного устройства
   */
  async getTemplatesByDevice(deviceId: number): Promise<CommandTemplate[]> {
    const response = await apiClient.get(`/api/v1/command_templates/by-device/${deviceId}`);
    return response.data;
  }

  /**
   * Получить шаблон команды по ID
   */
  async getTemplate(templateId: number): Promise<CommandTemplate> {
    const response = await apiClient.get(`/api/v1/command_templates/${templateId}`);
    return response.data;
  }

  /**
   * Получить шаблоны команд по модели устройства
   */
  async getTemplatesByModel(model: string): Promise<CommandTemplate[]> {
    return this.getTemplates({ model });
  }

  /**
   * Получить шаблоны команд по категории
   */
  async getTemplatesByCategory(category: string): Promise<CommandTemplate[]> {
    return this.getTemplates({ category });
  }

  /**
   * Получить шаблоны команд по категории и подкатегории
   */
  async getTemplatesByCategoryAndSubcategory(category: string, subcategory: string): Promise<CommandTemplate[]> {
    return this.getTemplates({ category, subcategory });
  }
}

export default new CommandTemplatesService(); 