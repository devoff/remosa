import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, AlertCircle } from 'lucide-react';
import monitoringMetricsService from '../../services/monitoringMetricsService';
export const MetricSelector = ({ value, onChange, onMetricSelect, error, category }) => {
    const [metrics, setMetrics] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(category || '');
    const [loading, setLoading] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState(null);
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await monitoringMetricsService.getCategories();
                setCategories(cats);
                if (!selectedCategory && cats.length > 0) {
                    setSelectedCategory(cats[0]);
                }
            }
            catch (error) {
                console.error('Error loading metric categories:', error);
            }
        };
        loadCategories();
    }, []);
    useEffect(() => {
        const loadMetrics = async () => {
            if (!selectedCategory)
                return;
            setLoading(true);
            try {
                const activeMetrics = await monitoringMetricsService.getMetricsByCategory(selectedCategory);
                setMetrics(activeMetrics);
            }
            catch (error) {
                console.error('Error loading metrics:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadMetrics();
    }, [selectedCategory]);
    const handleMetricChange = (technicalName) => {
        onChange(technicalName);
        const metric = metrics.find(m => m.technical_name === technicalName);
        setSelectedMetric(metric || null);
        if (metric && onMetricSelect) {
            onMetricSelect(metric);
        }
    };
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        onChange(''); // Сброс выбранной метрики при смене категории
        setSelectedMetric(null);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043C\u0435\u0442\u0440\u0438\u043A\u0438" }), _jsxs(Select, { value: selectedCategory, onValueChange: handleCategoryChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E" }) }), _jsx(SelectContent, { children: categories.map((cat) => (_jsx(SelectItem, { value: cat, children: cat }, cat))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "\u041C\u0435\u0442\u0440\u0438\u043A\u0430" }), _jsxs(Select, { value: value, onValueChange: handleMetricChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: loading ? "Загрузка..." : "Выберите метрику" }) }), _jsx(SelectContent, { className: "max-h-60", children: metrics.map((metric) => (_jsx(SelectItem, { value: metric.technical_name, children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: metric.human_name }), _jsx("span", { className: "text-xs text-muted-foreground", children: metric.technical_name })] }) }, metric.technical_name))) })] }), error && (_jsxs("p", { className: "text-red-500 text-sm mt-1 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), error] }))] }), selectedMetric && (_jsx(Card, { className: "bg-muted/50", children: _jsx(CardContent, { className: "pt-4", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium", children: selectedMetric.human_name }), selectedMetric.unit && (_jsx(Badge, { variant: "secondary", children: selectedMetric.unit }))] }), selectedMetric.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: selectedMetric.description })), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(Info, { className: "h-3 w-3" }), _jsxs("span", { children: ["\u0422\u0438\u043F: ", selectedMetric.data_type] }), selectedMetric.min_value && (_jsxs("span", { children: ["\u2022 \u041C\u0438\u043D: ", selectedMetric.min_value] })), selectedMetric.max_value && (_jsxs("span", { children: ["\u2022 \u041C\u0430\u043A\u0441: ", selectedMetric.max_value] }))] })] }) }) }))] }));
};
