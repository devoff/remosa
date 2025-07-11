import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Bell, RefreshCw, Trash2 } from 'lucide-react';
import apiService from '@/services/apiService';
const MonitoringPage = () => {
    const [statistics, setStatistics] = useState(null);
    const [systemHealth, setSystemHealth] = useState(null);
    const [failedJobs, setFailedJobs] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [statsRes, healthRes, failedRes, notifRes] = await Promise.all([
                apiService.get('/monitoring/statistics'),
                apiService.get('/monitoring/health'),
                apiService.get('/monitoring/failed-jobs'),
                apiService.get('/monitoring/notifications')
            ]);
            setStatistics(statsRes.data);
            setSystemHealth(healthRes.data);
            setFailedJobs(failedRes.data);
            setNotifications(notifRes.data);
        }
        catch (err) {
            setError('Ошибка при загрузке данных мониторинга');
            console.error('Monitoring data fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleMarkNotificationAsRead = async (notificationId) => {
        try {
            await apiService.post(`/monitoring/notifications/${notificationId}/mark-read`);
            // Обновляем список уведомлений
            const response = await apiService.get('/monitoring/notifications');
            setNotifications(response.data);
        }
        catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };
    const handleCleanup = async () => {
        try {
            await apiService.post('/monitoring/cleanup', { days: 30 });
            fetchData(); // Обновляем данные
        }
        catch (err) {
            console.error('Error during cleanup:', err);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy': return _jsx(CheckCircle, { className: "h-4 w-4" });
            case 'warning': return _jsx(AlertTriangle, { className: "h-4 w-4" });
            case 'error': return _jsx(AlertTriangle, { className: "h-4 w-4" });
            default: return _jsx(Activity, { className: "h-4 w-4" });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(RefreshCw, { className: "h-8 w-8 animate-spin" }) }));
    }
    if (error) {
        return (_jsxs(Alert, { variant: "error", children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u0441\u0438\u0441\u0442\u0435\u043C\u044B" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: fetchData, variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C"] }), _jsxs(Button, { onClick: handleCleanup, variant: "outline", size: "sm", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "\u041E\u0447\u0438\u0441\u0442\u043A\u0430"] })] })] }), systemHealth && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [getStatusIcon(systemHealth.system_status), "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Badge, { variant: "default", className: `${getStatusColor(systemHealth.system_status)} text-white`, children: systemHealth.system_status === 'healthy' ? 'Здорово' :
                                        systemHealth.system_status === 'warning' ? 'Предупреждение' : 'Ошибка' }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435: ", new Date().toLocaleString()] })] }) })] })), statistics && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u0412\u0441\u0435\u0433\u043E \u0437\u0430\u0434\u0430\u043D\u0438\u0439" }), _jsx(Database, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: statistics.total_jobs }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445: ", statistics.active_jobs] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: statistics.recent_executions }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u0417\u0430 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 24 \u0447\u0430\u0441\u0430" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u0423\u0441\u043F\u0435\u0448\u043D\u044B\u0445 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439" }), _jsx(CheckCircle, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: statistics.successful_executions }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u0443\u0441\u043F\u0435\u0445\u0430: ", Math.round(statistics.success_rate), "%"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "\u041D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0445 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439" }), _jsx(AlertTriangle, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: statistics.failed_executions }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u0422\u0440\u0435\u0431\u0443\u044E\u0442 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F" })] })] })] })), _jsxs(Tabs, { defaultValue: "failed-jobs", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "failed-jobs", children: "\u041D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F" }), _jsx(TabsTrigger, { value: "notifications", children: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F" })] }), _jsx(TabsContent, { value: "failed-jobs", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u041D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u043D\u0438\u0439" }) }), _jsx(CardContent, { children: failedJobs.length === 0 ? (_jsx("p", { className: "text-muted-foreground", children: "\u041D\u0435\u0442 \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0445 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439" })) : (_jsx("div", { className: "space-y-4", children: failedJobs.map((job, index) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "font-semibold", children: job.job_name }), _jsx(Badge, { variant: "error", children: "\u041E\u0448\u0438\u0431\u043A\u0430" })] }), _jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [_jsx(Clock, { className: "h-3 w-3 inline mr-1" }), new Date(job.executed_at).toLocaleString()] }), _jsx("p", { className: "text-sm text-red-600", children: job.error }), job.results && job.results.length > 0 && (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "text-sm cursor-pointer", children: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B" }), _jsx("pre", { className: "text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto", children: JSON.stringify(job.results, null, 2) })] }))] }, index))) })) })] }) }), _jsx(TabsContent, { value: "notifications", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F" }) }), _jsx(CardContent, { children: notifications.length === 0 ? (_jsx("p", { className: "text-muted-foreground", children: "\u041D\u0435\u0442 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439" })) : (_jsx("div", { className: "space-y-4", children: notifications.map((notification) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-4 w-4" }), _jsxs("span", { className: "font-medium", children: ["\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 #", notification.id] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "default", children: notification.status }), notification.status !== 'read' && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => handleMarkNotificationAsRead(notification.id), children: "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u043E\u0435" }))] })] }), _jsx("p", { className: "text-sm mb-2", children: notification.message }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [_jsx(Clock, { className: "h-3 w-3 inline mr-1" }), new Date(notification.created_at).toLocaleString()] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u0438: ", notification.recipients.join(', ')] })] }, notification.id))) })) })] }) })] })] }));
};
export default MonitoringPage;
