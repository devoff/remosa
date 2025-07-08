export interface Alert {
  id: string | number;
  title: string;
  status: string;
  severity: 'critical' | 'warning' | 'info';
  player_name?: string;
  player_id?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  description?: string;
  details?: any;
  data?: any;
  platform_id?: number;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  status: string;
  timestamp: string;
}