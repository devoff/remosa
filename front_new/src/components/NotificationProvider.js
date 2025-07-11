import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
const NotificationContext = createContext(undefined);
export const useNotification = () => {
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('useNotification called');
    }
    const ctx = useContext(NotificationContext);
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('NotificationContext value:', ctx);
    }
    if (!ctx) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return ctx;
};
const Snackbar = ({ children }) => _jsx(_Fragment, { children: children });
const MuiAlert = ({ children }) => _jsx(_Fragment, { children: children });
export const NotificationProvider = ({ children }) => {
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('NotificationProvider rendering');
    }
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info');
    const notify = (msg, sev = 'info') => {
        if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
            console.log('NotificationProvider.notify called:', msg, sev);
        }
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    };
    const handleClose = (_, reason) => {
        if (reason === 'clickaway')
            return;
        setOpen(false);
    };
    return (_jsxs(NotificationContext.Provider, { value: { notify }, children: [children, _jsx(Snackbar, { open: open, autoHideDuration: 4000, onClose: handleClose, anchorOrigin: { vertical: 'bottom', horizontal: 'center' }, children: _jsx(MuiAlert, { elevation: 6, variant: "filled", onClose: handleClose, severity: severity, sx: { width: '100%' }, children: message }) })] }));
};
