import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Box, Chip, IconButton } from '@mui/material';
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const statusColors = {
  ONLINE: {
    color: 'success',
    icon: <CheckCircleOutlined style={{ fontSize: '16px' }} />
  },
  WARNING: {
    color: 'warning',
    icon: <WarningOutlined style={{ fontSize: '16px' }} />
  },
  OFFLINE: {
    color: 'error',
    icon: <CloseCircleOutlined style={{ fontSize: '16px' }} />
  }
};

const DeviceCard = ({ device, onEdit, onDelete }) => {
  const status = statusColors[device.status] || statusColors.OFFLINE;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h5" component="div" gutterBottom>
              {device.name}
            </Typography>
            <Chip
              icon={status.icon}
              label={device.status}
              color={status.color}
              size="small"
              sx={{ mb: 2 }}
            />
          </Box>
          <Box>
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditOutlined />
            </IconButton>
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteOutlined />
            </IconButton>
          </Box>
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          ID: {device.id}
        </Typography>
        <Typography variant="body2">
          Последнее обновление: {new Date(device.last_update).toLocaleString()}
        </Typography>
        {device.description && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {device.description}
          </Typography>
        )}
        {device.grafana_uid && (
          <Typography variant="caption" display="block" color="text.secondary" mt={1}>
            Grafana UID: {device.grafana_uid}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

DeviceCard.propTypes = {
  device: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['ONLINE', 'WARNING', 'OFFLINE']).isRequired,
    last_update: PropTypes.string.isRequired,
    description: PropTypes.string,
    grafana_uid: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default DeviceCard; 