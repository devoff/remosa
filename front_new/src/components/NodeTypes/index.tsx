import React from 'react';
import { MessageSquare, Database, Code, ArrowDown, Server, Globe, Clock, Bug } from 'lucide-react';
import { NodeType } from '../../types';

export const nodeTypes: Record<string, NodeType> = {
  'telegram receiver': {
    type: 'telegram receiver',
    name: 'Telegram Receiver',
    category: 'Telegram',
    description: 'Receives messages from a Telegram bot',
    icon: <MessageSquare size={20} />,
    defaults: {
      name: { value: '' },
      bot: { value: '' },
    },
    inputs: 0,
    outputs: 2,
    color: '#3B82F6'
  },
  'telegram sender': {
    type: 'telegram sender',
    name: 'Telegram Sender',
    category: 'Telegram',
    description: 'Sends messages through a Telegram bot',
    icon: <MessageSquare size={20} />,
    defaults: {
      name: { value: '' },
      bot: { value: '' },
    },
    inputs: 1,
    outputs: 2,
    color: '#3B82F6'
  },
  'telegram event': {
    type: 'telegram event',
    name: 'Telegram Event',
    category: 'Telegram',
    description: 'Listens for Telegram events',
    icon: <MessageSquare size={20} />,
    defaults: {
      name: { value: '' },
      bot: { value: '' },
      event: { value: 'callback_query' }
    },
    inputs: 0,
    outputs: 1,
    color: '#3B82F6'
  },
  'postgresql': {
    type: 'postgresql',
    name: 'PostgreSQL',
    category: 'Database',
    description: 'Execute queries on PostgreSQL database',
    icon: <Database size={20} />,
    defaults: {
      name: { value: '' },
      query: { value: '' },
      postgreSQLConfig: { value: '' },
      split: { value: false },
      rowsPerMsg: { value: 1 }
    },
    inputs: 1,
    outputs: 1,
    color: '#10B981'
  },
  'function': {
    type: 'function',
    name: 'Function',
    category: 'Function',
    description: 'A JavaScript function',
    icon: <Code size={20} />,
    defaults: {
      name: { value: '' },
      func: { value: 'return msg;' },
      outputs: { value: 1 }
    },
    inputs: 1,
    outputs: 1,
    color: '#F59E0B'
  },
  'switch': {
    type: 'switch',
    name: 'Switch',
    category: 'Function',
    description: 'Route messages based on rules',
    icon: <ArrowDown size={20} />,
    defaults: {
      name: { value: '' },
      property: { value: 'payload' },
      rules: { value: [{ t: 'eq', v: '' }] },
      outputs: { value: 1 }
    },
    inputs: 1,
    outputs: 1,
    color: '#EC4899'
  },
  'http in': {
    type: 'http in',
    name: 'HTTP In',
    category: 'Network',
    description: 'HTTP input node',
    icon: <Server size={20} />,
    defaults: {
      name: { value: '' },
      url: { value: '' },
      method: { value: 'GET' }
    },
    inputs: 0,
    outputs: 1,
    color: '#8B5CF6'
  },
  'http request': {
    type: 'http request',
    name: 'HTTP Request',
    category: 'Network',
    description: 'Make HTTP requests',
    icon: <Globe size={20} />,
    defaults: {
      name: { value: '' },
      url: { value: '' },
      method: { value: 'GET' }
    },
    inputs: 1,
    outputs: 1,
    color: '#8B5CF6'
  },
  'delay': {
    type: 'delay',
    name: 'Delay',
    category: 'Function',
    description: 'Delay messages',
    icon: <Clock size={20} />,
    defaults: {
      name: { value: '' },
      timeout: { value: 5 },
      timeoutUnits: { value: 'seconds' }
    },
    inputs: 1,
    outputs: 1,
    color: '#64748B'
  },
  'debug': {
    type: 'debug',
    name: 'Debug',
    category: 'Output',
    description: 'Display messages in the debug panel',
    icon: <Bug size={20} />,
    defaults: {
      name: { value: '' },
      active: { value: true },
      console: { value: false }
    },
    inputs: 1,
    outputs: 0,
    color: '#94A3B8'
  }
};

export const getNodeTypeByType = (type: string): NodeType | undefined => {
  return nodeTypes[type];
};

export const getNodeColor = (type: string): string => {
  return nodeTypes[type]?.color || '#6B7280';
};

export const getNodeIcon = (type: string): React.ReactNode => {
  return nodeTypes[type]?.icon || <Code size={20} />;
};

export const getCategoryColors = (): Record<string, string> => {
  const categories: Record<string, string> = {};
  
  Object.values(nodeTypes).forEach(nodeType => {
    if (!categories[nodeType.category]) {
      categories[nodeType.category] = nodeType.color || '#888';
    }
  });
  
  return categories;
};