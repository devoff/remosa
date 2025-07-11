import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Typography, Button, Grid, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DevicesIcon from '@mui/icons-material/Devices';
import SmsIcon from '@mui/icons-material/Sms';
import InfoIcon from '@mui/icons-material/Info';
const PlatformLimitsPanel = ({ platform, isAdmin, onEdit }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435" }), platform.description && (_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 }, children: platform.description }))] }), isAdmin && (_jsx(Button, { variant: "outlined", startIcon: _jsx(EditIcon, {}), onClick: onEdit, children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }))] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(DevicesIcon, { sx: { mr: 1, color: 'primary.main' } }), _jsx(Typography, { variant: "h6", children: "\u041B\u0438\u043C\u0438\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" })] }), _jsx(Chip, { label: platform.devices_limit ? `${platform.devices_limit} устройств` : 'Без ограничений', color: platform.devices_limit ? 'primary' : 'default', variant: "outlined" })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(SmsIcon, { sx: { mr: 1, color: 'warning.main' } }), _jsx(Typography, { variant: "h6", children: "\u041B\u0438\u043C\u0438\u0442 SMS" })] }), _jsx(Chip, { label: platform.sms_limit ? `${platform.sms_limit} SMS` : 'Без ограничений', color: platform.sms_limit ? 'warning' : 'default', variant: "outlined" })] }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [_jsx(InfoIcon, { sx: { mr: 1, color: 'info.main' } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["\u0421\u043E\u0437\u0434\u0430\u043D\u0430: ", formatDate(platform.created_at)] })] }) }), platform.updated_at && (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 1 }, children: [_jsx(InfoIcon, { sx: { mr: 1, color: 'info.main' } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430: ", formatDate(platform.updated_at)] })] }) }))] })] }) }));
};
export default PlatformLimitsPanel;
