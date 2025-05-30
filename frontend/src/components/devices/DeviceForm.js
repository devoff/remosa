import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

const DeviceForm = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    grafana_uid: '',
    ...(initialData || {})
  });

  React.useEffect(() => {
    setFormData({ 
      name: '', 
      description: '', 
      grafana_uid: '', 
      ...(initialData || {})
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = initialData && initialData.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Редактировать устройство' : 'Добавить устройство'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              name="name"
              label="Название устройства"
              value={formData.name || ''}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              name="description"
              label="Описание"
              value={formData.description || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              name="grafana_uid"
              label="Grafana UID"
              value={formData.grafana_uid || ''}
              onChange={handleChange}
              fullWidth
              helperText="Уникальный идентификатор устройства в Grafana"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEditMode ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

DeviceForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    grafana_uid: PropTypes.string
  })
};

DeviceForm.defaultProps = {
  initialData: null
};

export default DeviceForm; 