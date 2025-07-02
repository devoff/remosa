import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/useAuth';

interface PlatformUser {
  id: number;
  email: string;
  is_active: boolean;
  platform_role: string;
  created_at: string;
}

interface PlatformUsersTableProps {
  users: PlatformUser[];
  onAdd: (userData: { user_id: number; role: string }) => void;
  onEdit: (userId: number, roleData: { role: string }) => void;
  onDelete: (userId: number) => void;
}

const PLATFORM_ROLES = [
  { value: 'admin', label: 'Администратор платформы', color: 'error' },
  { value: 'manager', label: 'Менеджер', color: 'warning' },
  { value: 'user', label: 'Пользователь платформы', color: 'primary' },
  { value: 'viewer', label: 'Наблюдатель', color: 'default' }
];

const PlatformUsersTable: React.FC<PlatformUsersTableProps> = ({ users, onAdd, onEdit, onDelete }) => {
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [newUserForm, setNewUserForm] = useState({ user_id: '', role: 'user' });
  const [editForm, setEditForm] = useState({ role: 'user' });
  const { get } = useApi();
  const { user } = useAuth();

  const fetchAllUsers = async () => {
    try {
      const usersData = await get('/users/');
      // Фильтруем пользователей, которые уже добавлены в платформу
      const availableUsers = usersData.filter((user: any) => 
        !users.some(platformUser => platformUser.id === user.id)
      );
      setAllUsers(availableUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenAddDialog = () => {
    fetchAllUsers();
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewUserForm({ user_id: '', role: 'user' });
  };

  const handleOpenEditDialog = (user: PlatformUser) => {
    setSelectedUser(user);
    setEditForm({ role: user.platform_role });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEditForm({ role: 'user' });
  };

  const handleAddUser = () => {
    if (newUserForm.user_id) {
      onAdd({ user_id: Number(newUserForm.user_id), role: newUserForm.role });
      handleCloseAddDialog();
    }
  };

  const handleEditUser = () => {
    if (selectedUser) {
      onEdit(selectedUser.id, { role: editForm.role });
      handleCloseEditDialog();
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Удалить пользователя из платформы?')) {
      onDelete(userId);
    }
  };

  const getRoleInfo = (role: string) => {
    return PLATFORM_ROLES.find(r => r.value === role) || PLATFORM_ROLES[2];
  };

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
        Добавить пользователя
      </Button>
      
      <TableContainer sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль в платформе</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Дата добавления</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const roleInfo = getRoleInfo(u.platform_role);
              const isCurrent = user?.email === u.email;
              return (
                <TableRow key={u.id} selected={isCurrent} sx={isCurrent ? { backgroundColor: '#e0f7fa' } : {}}>
                  <TableCell>
                    {u.email}
                    {isCurrent && (
                      <span style={{ color: '#06b6d4', marginLeft: 8, fontWeight: 500 }}>(вы)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`Права: ${getRoleInfo(u.platform_role).label}. ${u.platform_role === 'admin' ? 'Полный доступ к платформе.' : u.platform_role === 'manager' ? 'Управление пользователями и устройствами.' : u.platform_role === 'user' ? 'Выполнение команд и просмотр.' : 'Только просмотр.'}` }>
                      <Chip 
                        label={roleInfo.label} 
                        color={roleInfo.color as any} 
                        size="small" 
                        sx={isCurrent ? { fontWeight: 700, border: '2px solid #06b6d4' } : {}}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={u.is_active ? 'Активен' : 'Неактивен'} 
                      color={u.is_active ? 'success' : 'default'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenEditDialog(u)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteUser(u.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог добавления пользователя */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Добавить пользователя в платформу</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: '20px !important' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Пользователь</InputLabel>
            <Select
              value={newUserForm.user_id}
              onChange={(e) => setNewUserForm({ ...newUserForm, user_id: e.target.value })}
            >
              {allUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            >
              {PLATFORM_ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Отмена</Button>
          <Button onClick={handleAddUser} variant="contained">Добавить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования роли */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Изменить роль пользователя</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: '20px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Роль</InputLabel>
            <Select
              value={editForm.role}
              onChange={(e) => setEditForm({ role: e.target.value })}
            >
              {PLATFORM_ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Отмена</Button>
          <Button onClick={handleEditUser} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlatformUsersTable;
