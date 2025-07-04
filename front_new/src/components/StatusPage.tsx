import React from 'react';
import SystemStatusPanel from './SystemStatusPanel';

const StatusPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Статус системы</h1>
      <SystemStatusPanel />
    </div>
  );
};

export default StatusPage; 