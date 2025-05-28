import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Button } from '@mui/material';
import DeviceCard from '../components/DeviceCard';

interface Device {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      console.log('Начинаем загрузку устройств...');
      const response = await fetch('/api/v1/devices/');
      console.log('Статус ответа:', response.status);
      console.log('Заголовки ответа:', response.headers);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки устройств: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Текст ответа:', text);
      
      const data = JSON.parse(text);
      console.log('Распарсенные данные:', data);
      
      setDevices(data);
      console.log('Устройства установлены в состояние');
    } catch (err) {
      console.error('Ошибка при загрузке устройств:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  useEffect(() => {
    console.log('DeviceList компонент смонтирован');
    fetchDevices();
    return () => {
      console.log('DeviceList компонент размонтирован');
    };
  }, []);

  console.log('Текущее состояние devices:', devices);
  console.log('Текущее состояние error:', error);

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          Ошибка: {error}
        </Typography>
        <Button variant="contained" onClick={fetchDevices} sx={{ mt: 2 }}>
          Повторить
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Устройства
      </Typography>
      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={4} key={device.id}>
            <DeviceCard device={device} />
          </Grid>
        ))}
        {devices.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary">
              Устройства не найдены
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default DeviceList; 