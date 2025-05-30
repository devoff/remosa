import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Button } from '@mui/material';
import { PlusOutlined } from '@ant-design/icons';
import MainCard from '../../components/MainCard';
import DeviceCard from '../../components/devices/DeviceCard';
import DeviceForm from '../../components/devices/DeviceForm';
import axios from '../../utils/axios';

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/devices');
      setDevices(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddClick = () => {
    setSelectedDevice(null);
    setFormOpen(true);
  };

  const handleEditClick = (device) => {
    setSelectedDevice(device);
    setFormOpen(true);
  };

  const handleDeleteClick = async (deviceId) => {
    if (window.confirm('Вы уверены, что хотите удалить это устройство?')) {
      try {
        await axios.delete(`/api/v1/devices/${deviceId}`);
        await fetchDevices();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedDevice) {
        await axios.put(`/api/v1/devices/${selectedDevice.id}`, formData);
      } else {
        await axios.post('/api/v1/devices', formData);
      }
      await fetchDevices();
      setFormOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedDevice(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <MainCard 
      title="Мониторинг устройств"
      secondary={
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddClick}
          startIcon={<PlusOutlined />}
        >
          Добавить устройство
        </Button>
      }
    >
      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid key={device.id} item xs={12} sm={6} md={4} lg={3}>
            <DeviceCard 
              device={device}
              onEdit={() => handleEditClick(device)}
              onDelete={() => handleDeleteClick(device.id)}
            />
          </Grid>
        ))}
        {devices.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" textAlign="center">
              Устройства не найдены
            </Typography>
          </Grid>
        )}
      </Grid>

      <DeviceForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={selectedDevice}
      />
    </MainCard>
  );
};

export default DevicesPage; 