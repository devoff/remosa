import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';
import commandTemplatesService, { CommandTemplate } from '../../services/commandTemplatesService';

interface CommandSelectorProps {
  deviceId?: number;
  deviceModel?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onCommandSelect?: (template: CommandTemplate, parameters: Record<string, any>, finalCommand: string) => void;
  error?: string;
}

export const CommandSelector: React.FC<CommandSelectorProps> = ({
  deviceId,
  deviceModel,
  value,
  onChange,
  onCommandSelect,
  error
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<CommandTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [finalCommand, setFinalCommand] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await commandTemplatesService.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (error) {
        console.error('Error loading command categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Загрузка подкатегорий при изменении категории
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!selectedCategory) return;
      
      try {
        const subcats = await commandTemplatesService.getSubcategories(selectedCategory);
        setSubcategories(subcats);
        setSelectedSubcategory('');
      } catch (error) {
        console.error('Error loading subcategories:', error);
      }
    };
    loadSubcategories();
  }, [selectedCategory]);

  // Загрузка шаблонов команд
  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedCategory) return;
      
      setLoading(true);
      try {
        let templatesData: CommandTemplate[];
        
        if (deviceId) {
          // Если есть deviceId, загружаем шаблоны для конкретного устройства
          templatesData = await commandTemplatesService.getTemplatesByDevice(deviceId);
        } else if (deviceModel) {
          // Если есть модель устройства, фильтруем по модели
          templatesData = await commandTemplatesService.getTemplatesByModel(deviceModel);
        } else {
          // Иначе загружаем по категории
          templatesData = await commandTemplatesService.getTemplatesByCategory(selectedCategory);
        }
        
        // Дополнительная фильтрация по подкатегории
        if (selectedSubcategory) {
          templatesData = templatesData.filter(t => t.subcategory === selectedSubcategory);
        }
        
        setTemplates(templatesData);
      } catch (error) {
        console.error('Error loading command templates:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [selectedCategory, selectedSubcategory, deviceId, deviceModel]);

  // Генерация финальной команды при изменении параметров
  useEffect(() => {
    if (!selectedTemplate) return;
    
    try {
      let command = selectedTemplate.template;
      
      // Заменяем параметры в шаблоне
      Object.entries(parameters).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        command = command.replace(new RegExp(placeholder, 'g'), String(value));
      });
      
      setFinalCommand(command);
    } catch (error) {
      console.error('Error generating final command:', error);
      setFinalCommand('');
    }
  }, [selectedTemplate, parameters]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    setSelectedTemplate(template || null);
    setParameters({});
    onChange(template ? template.id : undefined);
    
    if (template && onCommandSelect) {
      onCommandSelect(template, {}, template.template);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    const newParameters = { ...parameters, [paramName]: value };
    setParameters(newParameters);
    
    if (selectedTemplate && onCommandSelect) {
      let command = selectedTemplate.template;
      Object.entries(newParameters).forEach(([key, val]) => {
        const placeholder = `{${key}}`;
        command = command.replace(new RegExp(placeholder, 'g'), String(val));
      });
      onCommandSelect(selectedTemplate, newParameters, command);
    }
  };

  const validateParameter = (paramName: string, value: any): string | null => {
    if (!selectedTemplate) return null;
    
    const paramSchema = selectedTemplate.params_schema.properties[paramName];
    if (!paramSchema) return null;
    
    const isRequired = selectedTemplate.params_schema.required?.includes(paramName);
    if (isRequired && !value) {
      return 'Это поле обязательно';
    }
    
    if (paramSchema.pattern && !new RegExp(paramSchema.pattern).test(value)) {
      return 'Неверный формат';
    }
    
    if (paramSchema.enum && !paramSchema.enum.includes(value)) {
      return 'Неверное значение';
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Категория команды</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {subcategories.length > 0 && (
          <div>
            <Label>Подкатегория</Label>
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите подкатегорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все подкатегории</SelectItem>
                {subcategories.map((subcat) => (
                  <SelectItem key={subcat} value={subcat}>
                    {subcat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label>Шаблон команды</Label>
        <Select value={value?.toString() || ''} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Загрузка..." : "Выберите шаблон команды"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{template.name}</span>
                  {template.subcategory && (
                    <span className="text-xs text-muted-foreground">
                      {template.subcategory}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      {selectedTemplate && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {selectedTemplate.name}
              {selectedTemplate.subcategory && (
                <Badge variant="outline">{selectedTemplate.subcategory}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.description && (
              <p className="text-sm text-muted-foreground">
                {selectedTemplate.description}
              </p>
            )}

            {/* Параметры команды */}
            {selectedTemplate.params_schema.properties && 
             Object.keys(selectedTemplate.params_schema.properties).length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Параметры команды</Label>
                {Object.entries(selectedTemplate.params_schema.properties).map(([paramName, paramSchema]) => {
                  const isRequired = selectedTemplate.params_schema.required?.includes(paramName);
                  const error = validateParameter(paramName, parameters[paramName]);
                  
                  return (
                    <div key={paramName} className="space-y-1">
                      <Label className="text-sm">
                        {paramSchema.title || paramName}
                        {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {paramSchema.enum ? (
                        <Select 
                          value={parameters[paramName] || ''} 
                          onValueChange={(value) => handleParameterChange(paramName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Выберите ${paramSchema.title || paramName}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {paramSchema.enum.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={paramSchema.type === 'number' ? 'number' : 'text'}
                          placeholder={paramSchema.title || paramName}
                          value={parameters[paramName] || ''}
                          onChange={(e) => handleParameterChange(paramName, e.target.value)}
                          className={error ? 'border-red-500' : ''}
                        />
                      )}
                      
                      {error && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {error}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Финальная команда */}
            {finalCommand && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Итоговая команда
                </Label>
                <div className="p-3 bg-background border rounded-md">
                  <code className="text-sm break-all">{finalCommand}</code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 