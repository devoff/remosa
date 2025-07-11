import { create } from 'zustand';
import { api } from '../lib/api';
export const useAlertStore = create((set, get) => ({
    alerts: [],
    loading: false,
    error: null,
    selectedAlert: null,
    fetchAlerts: async () => {
        set({ loading: true, error: null });
        try {
            const data = await api.getAlerts();
            set({ alerts: data });
        }
        catch (error) {
            set({ error: error.message });
        }
        finally {
            set({ loading: false });
        }
    },
    createAlert: async (alert) => {
        set({ loading: true, error: null });
        try {
            const data = await api.createAlert(alert);
            set(state => ({ alerts: [data, ...state.alerts] }));
        }
        catch (error) {
            set({ error: error.message });
        }
        finally {
            set({ loading: false });
        }
    },
    updateAlert: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const updatedAlert = await api.updateAlert(id, data);
            set(state => ({
                alerts: state.alerts.map(alert => String(alert.id) === String(id) ? updatedAlert : alert)
            }));
        }
        catch (error) {
            set({ error: error.message });
        }
        finally {
            set({ loading: false });
        }
    },
    selectAlert: (alert) => {
        set({ selectedAlert: alert });
    },
    getAlertHistory: async (alertId) => {
        try {
            return await api.getAlertHistory(alertId);
        }
        catch (error) {
            set({ error: error.message });
            return [];
        }
    }
}));
