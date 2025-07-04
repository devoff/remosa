export interface SystemStatus {
  uptime: string;
  totalDevices: number;
  activeAlerts: number;
  resolvedAlerts: number;
  latestAlert: string;
  dbStatus: string;
  dbConnections: number;
  apiStatus: string;
  telegramStatus: string;
  smsStatus: string;
} 