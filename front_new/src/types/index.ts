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

export interface NodeType {
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
}

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