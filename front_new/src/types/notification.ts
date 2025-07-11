export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'alert' | 'error' | 'info' | 'warning';
  read_status: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NotificationCreate {
  user_id: number;
  title: string;
  message: string;
  type: 'alert' | 'error' | 'info' | 'warning';
}

export interface NotificationList {
  items: Notification[];
  total: number;
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationMarkReadResponse {
  message: string;
  updated_count: number;
} 