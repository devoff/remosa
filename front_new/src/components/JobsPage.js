import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Play, Pause, Trash2, Eye, Settings, AlertTriangle, Bell, Terminal, CheckCircle, Edit2 } from 'lucide-react';
import { useExporterApi } from '../lib/exporterApi';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import JobDialog from './Jobs/JobDialog';
import JobDetailsModal from './Jobs/JobDetailsModal';
const JobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [executing, setExecuting] = useState(null);
    const { getJobs, deleteJob, executeJob } = useExporterApi();
    const { isSuperAdmin } = useAuth();
    const { notify } = useNotification();
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const jobsData = await getJobs();
            setJobs(jobsData);
        }
        catch (error) {
            notify('Ошибка при загрузке данных', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleExecute = async (jobId) => {
        try {
            setExecuting(jobId);
            await executeJob(jobId);
            await loadData();
            notify('Задание выполнено', 'success');
        }
        catch (error) {
            notify('Ошибка при выполнении задания', 'error');
        }
        finally {
            setExecuting(null);
        }
    };
    const handleDelete = async (jobId) => {
        if (!confirm('Вы уверены, что хотите удалить это задание?'))
            return;
        try {
            await deleteJob(jobId);
            await loadData();
            notify('Задание удалено', 'success');
        }
        catch (error) {
            notify('Ошибка при удалении', 'error');
        }
    };
    const getJobTypeIcon = (jobType) => {
        switch (jobType) {
            case 'alert':
                return _jsx(AlertTriangle, { className: "text-red-400", size: 16 });
            case 'notification':
                return _jsx(Bell, { className: "text-blue-400", size: 16 });
            case 'command':
                return _jsx(Terminal, { className: "text-green-400", size: 16 });
            default:
                return _jsx(Settings, { className: "text-gray-400", size: 16 });
        }
    };
    const getJobTypeText = (jobType) => {
        switch (jobType) {
            case 'alert':
                return 'Алерт';
            case 'notification':
                return 'Уведомление';
            case 'command':
                return 'Команда';
            default:
                return 'Неизвестно';
        }
    };
    const getStatusIcon = (job) => {
        if (job.is_active) {
            return _jsx(CheckCircle, { className: "text-green-500", size: 16 });
        }
        return _jsx(Pause, { className: "text-gray-500", size: 16 });
    };
    if (!isSuperAdmin) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-900/20 border border-red-500/50 rounded-lg p-4", children: [_jsx("h2", { className: "text-red-400 font-semibold", children: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D" }), _jsx("p", { className: "text-gray-300 mt-2", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F\u043C\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430\u043C." })] }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-100", children: "\u0417\u0430\u0434\u0430\u043D\u0438\u044F" }), _jsx("p", { className: "text-gray-400 mt-1", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u043C\u0438 \u0437\u0430\u0434\u0430\u043D\u0438\u044F\u043C\u0438 (\u0430\u043D\u0430\u043B\u043E\u0433 Grafana alerts)" })] }), _jsxs("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Plus, { size: 16 }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u043D\u0438\u0435"] })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg border border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-100", children: "\u0417\u0430\u0434\u0430\u043D\u0438\u044F" }), _jsx("button", { onClick: loadData, disabled: loading, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(RefreshCw, { size: 16, className: loading ? 'animate-spin' : '' }) })] }) }), loading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-2", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] })) : jobs.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(AlertTriangle, { className: "text-gray-500 mx-auto mb-4", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-300 mb-2", children: "\u041D\u0435\u0442 \u0437\u0430\u0434\u0430\u043D\u0438\u0439" }), _jsx("p", { className: "text-gray-500 mb-4", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u043E\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u0435 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }), _jsx("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u043D\u0438\u0435" })] })) : (_jsx("div", { className: "divide-y divide-gray-700", children: jobs.map((job) => (_jsxs("div", { className: "p-4 hover:bg-gray-750 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusIcon(job), getJobTypeIcon(job.job_type), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-100", children: job.name }), _jsxs("p", { className: "text-sm text-gray-400", children: [getJobTypeText(job.job_type), " \u2022 ", job.conditions.length, " \u0443\u0441\u043B\u043E\u0432\u0438\u0439"] })] })] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("p", { className: `text-sm font-medium ${job.is_active ? 'text-green-400' : 'text-gray-500'}`, children: job.is_active ? 'Активно' : 'Неактивно' })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0439" }), _jsx("p", { className: "text-sm font-medium text-gray-300", children: job.execution_count })] }), job.last_executed_at && (_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435" }), _jsx("p", { className: "text-sm font-medium text-gray-300", children: new Date(job.last_executed_at).toLocaleDateString('ru-RU') })] })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => {
                                                                setSelectedJob(job);
                                                                setShowDetails(true);
                                                            }, className: "text-gray-400 hover:text-gray-200 transition-colors", title: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { onClick: () => handleExecute(job.id), disabled: executing === job.id, className: "text-gray-400 hover:text-green-400 transition-colors", title: "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C", children: _jsx(Play, { size: 16, className: executing === job.id ? 'animate-pulse' : '' }) }), _jsx("button", { onClick: () => {
                                                                setSelectedJob(job);
                                                                setShowDialog(true);
                                                            }, className: "text-gray-400 hover:text-blue-400 transition-colors", title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { onClick: () => handleDelete(job.id), className: "text-gray-400 hover:text-red-400 transition-colors", title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(Trash2, { size: 16 }) })] })] })] }), job.description && (_jsx("p", { className: "text-sm text-gray-400 mt-2", children: job.description }))] }, job.id))) }))] }), showDialog && (_jsx(JobDialog, { onClose: () => setShowDialog(false), onSave: async () => {
                    setShowDialog(false);
                    await loadData();
                } })), showDetails && selectedJob && (_jsx(JobDetailsModal, { job: selectedJob, onClose: () => {
                    setShowDetails(false);
                    setSelectedJob(null);
                } }))] }));
};
export default JobsPage;
