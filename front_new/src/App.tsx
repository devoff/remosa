import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AlertsPanel from './components/Monitoring/AlertsPanel';
import StatusBar from './components/Monitoring/StatusBar';
import DevicesList from './components/Monitoring/DevicesList';
import { CommandLogsPage } from './components/CommandLogsPage';

console.log('API URL:', import.meta.env.VITE_API_URL);

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<DevicesList />} />
              <Route path="/command-logs" element={<CommandLogsPage />} />
            </Routes>
            <div className="mt-auto">
              <AlertsPanel />
            </div>
          </div>
        </div>
        <StatusBar />
      </div>
    </Router>
  );
}

export default App;