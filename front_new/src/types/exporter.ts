export interface Exporter {
  id: number;
  name: string;
  platform_type: 'cubicmedia' | 'addreality';
  mac_addresses: string[];
  platform_id: string;
  is_active: boolean;
  api_key?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  last_sync_at?: string;
  sync_status?: 'success' | 'error' | 'pending';
  error_message?: string;
}

export interface ExporterMetrics {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  last_sync: string;
  platform_id: string;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  job_type: 'alert' | 'command' | 'notification';
  conditions: JobCondition[];
  actions: JobAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  last_executed_at?: string;
  execution_count: number;
}

export interface JobCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface JobAction {
  type: 'send_notification' | 'execute_command' | 'webhook';
  config: {
    message?: string;
    command_template_id?: number;
    webhook_url?: string;
    recipients?: string[];
  };
}

export interface ExporterConfig {
  id: number;
  exporter_id: number;
  config_key: string;
  config_value: string;
  created_at: string;
  updated_at: string;
}

export interface ExporterStats {
  total_exporters: number;
  active_exporters: number;
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  last_sync: string;
}

export interface Device {
  mac_address: string;
  platform_id: string;
  status: 'online' | 'offline';
  ip_address?: string;
  last_seen: string;
  labels: Record<string, string>;
}

export interface ExporterFormData {
  name: string;
  platform_type: 'cubicmedia' | 'addreality';
  mac_addresses: string[];
  platform_id: string;
  is_active: boolean;
  api_key?: string;
  tags?: string[];
}

export interface JobFormData {
  name: string;
  description?: string;
  job_type: 'alert' | 'command' | 'notification';
  conditions: JobCondition[];
  actions: JobAction[];
  is_active: boolean;
} 