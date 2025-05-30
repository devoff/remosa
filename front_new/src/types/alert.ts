export interface Alert {
  id: string;
  title: string;
  status: 'firing' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  player_name: string;
  player_id: string;
  platform: string;
  description?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metrics?: Record<string, any>;
  source: 'grafana' | 'system' | 'manual';
  source_id?: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  status: string;
  created_at: string;
  user_id?: string;
  comment?: string;
}