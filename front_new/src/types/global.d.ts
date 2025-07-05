// Глобальные декларации типов
declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
  }
  
  export const AlertCircle: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const ChevronUp: FC<IconProps>;
  export const Check: FC<IconProps>;
  export const ExternalLink: FC<IconProps>;
  export const History: FC<IconProps>;
  export const RefreshCw: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const Eye: FC<IconProps>;
  export const Server: FC<IconProps>;
  export const Wifi: FC<IconProps>;
  export const WifiOff: FC<IconProps>;
  export const Globe: FC<IconProps>;
  export const Hash: FC<IconProps>;
  export const X: FC<IconProps>;
  export const Activity: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const EyeOff: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Menu: FC<IconProps>;
  export const Terminal: FC<IconProps>;
  export const HelpCircle: FC<IconProps>;
  export const AlertTriangle: FC<IconProps>;
  export const Save: FC<IconProps>;
  export const Play: FC<IconProps>;
  export const Pause: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const Database: FC<IconProps>;
  export const Code: FC<IconProps>;
  export const ArrowDown: FC<IconProps>;
  export const Bug: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const Briefcase: FC<IconProps>;
  export const FileText: FC<IconProps>;
  export const Shield: FC<IconProps>;
  export const Home: FC<IconProps>;
  export const BarChart3: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const RefreshCcw: FC<IconProps>;
}

declare module 'date-fns' {
  export function format(date: Date | number, pattern: string): string;
}

// Исправления для antd
declare module 'antd/es/table' {
  export interface ColumnType<T = any> {
    title?: string;
    dataIndex?: string;
    key?: string;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    width?: number | string;
    fixed?: 'left' | 'right';
    sorter?: boolean | ((a: T, b: T) => number);
    filters?: Array<{ text: string; value: any }>;
    onFilter?: (value: any, record: T) => boolean;
  }
}

// Декларации для antd
declare module 'antd' {
  import { ComponentType } from 'react';
  
  export const Card: ComponentType<any>;
  export const Spin: ComponentType<any>;
  export const Alert: ComponentType<any>;
  export const Typography: ComponentType<any>;
  export const Table: ComponentType<any>;
  export const Tag: ComponentType<any>;
  export const Select: ComponentType<any>;
  export const Descriptions: ComponentType<any>;
  export const Input: ComponentType<any>;
  export const DatePicker: ComponentType<any>;
  export const Button: ComponentType<any>;
  export const Space: ComponentType<any>;
  export const Modal: ComponentType<any>;
  export const Form: ComponentType<any>;
  export const InputNumber: ComponentType<any>;
  export const message: ComponentType<any>;
  export const Switch: ComponentType<any>;
  export const Popconfirm: ComponentType<any>;
  export const Row: ComponentType<any>;
  export const Col: ComponentType<any>;
  export const Statistic: ComponentType<any>;
  export const Tabs: ComponentType<any>;
  export const Checkbox: ComponentType<any>;
  export const notification: ComponentType<any>;
}

// Декларации для @mui/material
declare module '@mui/material' {
  import { ComponentType } from 'react';
  
  export const Dialog: ComponentType<any>;
  export const DialogTitle: ComponentType<any>;
  export const DialogContent: ComponentType<any>;
  export const DialogActions: ComponentType<any>;
  export const DialogContentText: ComponentType<any>;
  export const Button: ComponentType<any>;
  export const TextField: ComponentType<any>;
  export const Alert: ComponentType<any>;
  export const Box: ComponentType<any>;
  export const Typography: ComponentType<any>;
  export const LinearProgress: ComponentType<any>;
  export const MenuItem: ComponentType<any>;
  export const Table: ComponentType<any>;
  export const TableBody: ComponentType<any>;
  export const TableCell: ComponentType<any>;
  export const TableContainer: ComponentType<any>;
  export const TableHead: ComponentType<any>;
  export const TableRow: ComponentType<any>;
  export const Paper: ComponentType<any>;
  export const IconButton: ComponentType<any>;
  export const CircularProgress: ComponentType<any>;
  export const Chip: ComponentType<any>;
  export const FormControl: ComponentType<any>;
  export const InputLabel: ComponentType<any>;
  export const Select: ComponentType<any>;
  export const Grid: ComponentType<any>;
  export const Card: ComponentType<any>;
  export const CardContent: ComponentType<any>;
  export const Tabs: ComponentType<any>;
  export const Tab: ComponentType<any>;
  export const Slider: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const RadioGroup: ComponentType<any>;
  export const FormControlLabel: ComponentType<any>;
  export const Radio: ComponentType<any>;
  export const Divider: ComponentType<any>;
}

declare module '@mui/material/Snackbar' {
  import { ComponentType } from 'react';
  export const Snackbar: ComponentType<any>;
}

declare module '@mui/material/Alert' {
  import { ComponentType } from 'react';
  export const Alert: ComponentType<any>;
  export type AlertColor = 'error' | 'warning' | 'info' | 'success';
}

// Типы для уведомлений
export interface NotificationContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export interface NotificationContextProps {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  hideNotification: () => void;
  notification: {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null;
}

declare global {
  var NotificationContextType: NotificationContextType;
  var NotificationContextProps: NotificationContextProps;
}

export {}; 