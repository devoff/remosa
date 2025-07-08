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
  // Prometheus monitoring fields
  monitoring_device_mac?: string;
  monitoring_metric?: string;
  operator?: string;
  threshold_value?: string;
  last_prometheus_value?: string;
  last_check_time?: string;
  platform_id: number;
  device_id?: number;
  command?: string;
  command_template_id?: number;
  schedule?: string;
  timeout?: number;
  retry_count?: number;
  retry_delay?: number;
}

export interface JobCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal';
  value: string | number;
  // Новые поля для метрик мониторинга
  monitoring_device_mac?: string;
  monitoring_metric?: string;
  metric_human_name?: string;
  metric_unit?: string;
  metric_description?: string;
}

export interface JobAction {
  type: 'send_notification' | 'execute_command' | 'webhook';
  config: {
    message?: string;
    command_template_id?: number;
    webhook_url?: string;
    recipients?: string[];
    // Новые поля для параметризованных команд
    command_template_name?: string;
    command_template_category?: string;
    command_template_subcategory?: string;
    command_parameters?: Record<string, any>;
    final_command?: string;
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
  mac: string;
  name: string;
  status: number;
  status_text: string;
  ip: string;
  outip: string;
  platform_id: string;
  exporter_id: string;
  // AddReality-specific fields
  device_id?: string;
  player_version?: string;
  time_zone?: string;
  activation_state?: string;
  last_online?: string;
  platform_type?: 'cubicmedia' | 'addreality';
  // старые поля для обратной совместимости
  mac_address?: string;
  status_old?: 'online' | 'offline';
  ip_address?: string;
  last_seen?: string;
  labels?: Record<string, string>;
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
  // Prometheus monitoring fields
  monitoring_device_mac?: string;
  monitoring_metric?: string;
  operator?: string;
  threshold_value?: string;
  platform_id: number;
  device_id?: number;
  command?: string;
  command_template_id?: number;
  schedule?: string;
  timeout?: number;
  retry_count?: number;
  retry_delay?: number;
}

// Новые типы для Prometheus интеграции
export interface PrometheusDevice {
  mac: string;
  name: string;
  status: number;
  status_text: string;
  exporter_id: number;
  exporter_name: string;
  platform_id: number;
  display_name: string;
  metrics?: Record<string, any>;
}

export interface ManagementDevice {
  id: number;
  name: string;
  phone: string;
  platform_id: number;
  display_name: string;
  model?: string;
}

export interface DeviceMetrics {
  device_mac: string;
  exporter_id: number;
  exporter_name: string;
  platform_id: number;
  metrics: Record<string, any>;
  status: number;
  status_text: string;
}

export interface JobExecution {
  id: number;
  job_id: number;
  status: string; // pending, running, completed, failed
  success?: boolean;
  started_at?: string;
  completed_at?: string;
  duration?: number;
  output?: string;
  error_message?: string;
  exit_code?: number;
  created_at: string;
  prometheus_value?: string;
  condition_met?: boolean;
  monitoring_device_mac?: string;
  monitoring_metric?: string;
} 