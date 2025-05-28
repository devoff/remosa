
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Layout } from 'antd';
import DeviceList from './pages/DeviceList';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';

const { Content } = Layout;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar />
          <Layout>
            <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceList />} />
                <Route path="/alerts" element={<div>Страница алертов</div>} />
                <Route path="/clients" element={<div>Страница клиентов</div>} />
                <Route path="/logs" element={<div>Страница логов</div>} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </ThemeProvider>
    </Router>
  );
}

export default App;
