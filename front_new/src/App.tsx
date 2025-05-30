import React from 'react';
//import { ReactFlow } from 'reactflow';
//import 'reactflow/dist/style.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
//import { useFlowStore } from './store/flowStore';
//import { FlowNode } from './components/FlowEditor/FlowNode';
import AlertsPanel from './components/Monitoring/AlertsPanel';
import StatusBar from './components/Monitoring/StatusBar';
import DevicesList from './components/Monitoring/DevicesList';

//const nodeTypes = {
//  customNode: FlowNode,
//};

function App() {
 // const { isEditingConfig } = useFlowStore();

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
          <div className="flex-1 flex flex-col">
          <DevicesList />
          <div className="mt-auto">
            <AlertsPanel />
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

export default App;