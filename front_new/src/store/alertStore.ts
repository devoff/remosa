import { create } from 'zustand';
import { Alert, AlertHistory } from '../types/alert';
import { api } from '../lib/api';

interface AlertStore {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  selectedAlert: Alert | null;
  
  fetchAlerts: () => Promise<void>;
  createAlert: (alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAlert: (id: string, data: Partial<Alert>) => Promise<void>;
  selectAlert: (alert: Alert | null) => void;
  getAlertHistory: (alertId: string) => Promise<AlertHistory[]>;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  loading: false,
  error: null,
  selectedAlert: null,

  fetchAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getAlerts();
      set({ alerts: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createAlert: async (alert) => {
    set({ loading: true, error: null });
    try {
      const data = await api.createAlert(alert);
      set(state => ({ alerts: [data, ...state.alerts] }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateAlert: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedAlert = await api.updateAlert(id, data);
      set(state => ({
        alerts: state.alerts.map(alert => 
          String(alert.id) === String(id) ? updatedAlert : alert
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  selectAlert: (alert) => {
    set({ selectedAlert: alert });
  },

  getAlertHistory: async (alertId) => {
    try {
      return await api.getAlertHistory(alertId);
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  }
}));