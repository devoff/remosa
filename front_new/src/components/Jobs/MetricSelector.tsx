import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, AlertCircle } from 'lucide-react';
import monitoringMetricsService, { MonitoringMetric } from '../../services/monitoringMetricsService';

interface MetricSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onMetricSelect?: (metric: MonitoringMetric) => void;
  error?: string;
  category?: string;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  value,
  onChange,
  onMetricSelect,
  error,
  category
}) => {
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || '');
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MonitoringMetric | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await monitoringMetricsService.getCategories();
        setCategories(cats);
        if (!selectedCategory && cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (error) {
        console.error('Error loading metric categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedCategory) return;
      
      setLoading(true);
      try {
        const activeMetrics = await monitoringMetricsService.getMetricsByCategory(selectedCategory);
        setMetrics(activeMetrics);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [selectedCategory]);

  const handleMetricChange = (technicalName: string) => {
    onChange(technicalName);
    const metric = metrics.find(m => m.technical_name === technicalName);
    setSelectedMetric(metric || null);
    if (metric && onMetricSelect) {
      onMetricSelect(metric);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onChange(''); // Сброс выбранной метрики при смене категории
    setSelectedMetric(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Категория метрики</Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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

      <div>
        <Label>Метрика</Label>
        <Select value={value} onValueChange={handleMetricChange}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Загрузка..." : "Выберите метрику"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {metrics.map((metric) => (
              <SelectItem key={metric.technical_name} value={metric.technical_name}>
                <div className="flex flex-col">
                  <span className="font-medium">{metric.human_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {metric.technical_name}
                  </span>
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

      {selectedMetric && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{selectedMetric.human_name}</h4>
                {selectedMetric.unit && (
                  <Badge variant="secondary">{selectedMetric.unit}</Badge>
                )}
              </div>
              
              {selectedMetric.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedMetric.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Тип: {selectedMetric.data_type}</span>
                {selectedMetric.min_value && (
                  <span>• Мин: {selectedMetric.min_value}</span>
                )}
                {selectedMetric.max_value && (
                  <span>• Макс: {selectedMetric.max_value}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 