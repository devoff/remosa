import React from 'react';

export interface NodeData {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  x: number;
  y: number;
  inputs: number;
  outputs: number;
  icon?: string;
  config?: any;
  disabled?: boolean;
  wires: string[][];
}

export interface FlowData {
  id: string;
  label: string;
  nodes: NodeData[];
  disabled?: boolean;
  info?: string;
  env?: string[];
}

export type NodeType = {
  type: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  defaults: {
    name: { value: string };
    [key: string]: { value: any };
  };
  inputs: number;
  outputs: number;
  color?: string;
};

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
}

export interface NodeConfig {
  id?: string;
  type: string;
  name?: string;
  [key: string]: any;
}

export interface TelegramMessagePayload {
  chatId: number | string;
  type: string;
  content: string;
  options?: any;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface SimulationEvent {
  type: 'message' | 'data' | 'error' | 'status';
  nodeId: string;
  payload: any;
  timestamp: number;
}

export interface SimulationState {
  running: boolean;
  events: SimulationEvent[];
  activeNodes: string[];
}

export interface FlowStore {
  flows: FlowData[];
  currentFlow: string | null;
  selectedNode: string | null;
  clipboard: NodeData | null;
  simulation: SimulationState;
  isEditingConfig: boolean;
  
  // Actions
  addNode: (node: NodeData) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  removeNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  copyNode: (nodeId: string) => void;
  pasteNode: () => void;
  importFlow: (flow: FlowData) => void;
  exportFlow: () => FlowData;
  startSimulation: () => void;
  stopSimulation: () => void;
  addSimulationEvent: (event: SimulationEvent) => void;
  setEditingConfig: (editing: boolean) => void;
}

export interface Device {
  id: string;
  name: string;
  phone?: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  description?: string;
  last_update: string;
  created_at: string;
  model?: string;
  grafana_uid?: string;
}

export interface CommandTemplate {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  model?: string;
  params_schema: {
    type: string;
    properties: { [key: string]: { type: string; title?: string; pattern?: string; enum?: any[]; }; };
    required?: string[];
  };
}

export interface CommandParamDefinition {
  name: string;
  type: string;
  pattern?: string;
  min?: number;
  max?: number;
  title?: string;
  enum?: any[];
}

export interface CommandTemplateCreate extends Omit<CommandTemplate, 'id'> {}

export interface DeviceCommand {
  device_id: string;
  template_id: string;
  params: Record<string, any>;
  status?: 'pending' | 'success' | 'failed';
}

export interface CommandLog {
  id: number;
  device_id: number;
  message: string;
  level: string;
  command?: string;
  response?: string;
  created_at: string;
  updated_at?: string;
  execution_time?: string; // Или number, если это float
  extra_data?: string; // Теперь это JSON строка
  status?: string; // Добавляем поле status
}

export interface DeviceCommandsPanelProps {
  deviceId: number;
  deviceModel?: string;
  onClose: () => void;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
}

export interface UserCreate {
  username: string;
  email?: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}