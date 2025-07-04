import React, { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';

interface NotificationContextProps {
  notify: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  console.log('useNotification called');
  const ctx = useContext(NotificationContext);
  console.log('NotificationContext value:', ctx);
  if (!ctx) {
    console.error('NotificationContext is undefined');
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  console.log('NotificationProvider rendering');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const notify = (msg: string, sev: AlertColor = 'info') => {
    console.log('NotificationProvider.notify called:', msg, sev);
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = (_: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </MuiAlert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}; 