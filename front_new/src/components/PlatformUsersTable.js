import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Tooltip, FormControlLabel, Switch } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/useAuth';
const PLATFORM_ROLES = [
    { value: 'admin', label: 'Администратор платформы', color: 'error' },
    { value: 'manager', label: 'Менеджер', color: 'warning' },
    { value: 'user', label: 'Пользователь платформы', color: 'primary' },
    { value: 'viewer', label: 'Наблюдатель', color: 'default' }
];
const PlatformUsersTable = ({ users, onAdd, onEdit, onDelete }) => {
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUserForm, setNewUserForm] = useState({ user_id: '', role: 'user' });
    const [editForm, setEditForm] = useState({ role: 'user', email: '', password: '', is_active: true });
    const { get } = useApi();
    const { user } = useAuth();
    const fetchAllUsers = async () => {
        try {
            const usersData = await get('/users/');
            // Фильтруем пользователей, которые уже добавлены в платформу
            const availableUsers = usersData.filter((user) => !users.some(platformUser => platformUser.id === user.id));
            setAllUsers(availableUsers);
        }
        catch (error) {
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
    const handleOpenEditDialog = (user) => {
        setSelectedUser(user);
        setEditForm({
            role: user.platform_role,
            email: user.email,
            password: '',
            is_active: user.is_active
        });
        setOpenEditDialog(true);
    };
    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setSelectedUser(null);
        setEditForm({ role: 'user', email: '', password: '', is_active: true });
    };
    const handleAddUser = () => {
        if (newUserForm.user_id) {
            onAdd({ user_id: Number(newUserForm.user_id), role: newUserForm.role });
            handleCloseAddDialog();
        }
    };
    const handleEditUser = () => {
        if (selectedUser) {
            onEdit(selectedUser.id, {
                role: editForm.role
            });
            handleCloseEditDialog();
        }
    };
    const handleDeleteUser = (userId) => {
        if (window.confirm('Удалить пользователя из платформы?')) {
            onDelete(userId);
        }
    };
    const getRoleInfo = (role) => {
        return PLATFORM_ROLES.find(r => r.value === role) || PLATFORM_ROLES[2];
    };
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleOpenAddDialog, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" }), _jsx(TableContainer, { sx: { mt: 2 }, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Email" }), _jsx(TableCell, { children: "\u0420\u043E\u043B\u044C \u0432 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435" }), _jsx(TableCell, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(TableCell, { children: "\u0414\u0430\u0442\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }), _jsx(TableCell, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(TableBody, { children: users.map((u) => {
                                const roleInfo = getRoleInfo(u.platform_role);
                                const isCurrent = user?.email === u.email;
                                return (_jsxs(TableRow, { selected: isCurrent, sx: isCurrent ? { backgroundColor: '#e0f7fa' } : {}, children: [_jsxs(TableCell, { children: [u.email, isCurrent && (_jsx("span", { style: { color: '#06b6d4', marginLeft: 8, fontWeight: 500 }, children: "(\u0432\u044B)" }))] }), _jsx(TableCell, { children: _jsx(Tooltip, { title: `Права: ${getRoleInfo(u.platform_role).label}. ${u.platform_role === 'admin' ? 'Полный доступ к платформе.' : u.platform_role === 'manager' ? 'Управление пользователями и устройствами.' : u.platform_role === 'user' ? 'Выполнение команд и просмотр.' : 'Только просмотр.'}`, children: _jsx(Chip, { label: roleInfo.label, color: roleInfo.color, size: "small", sx: isCurrent ? { fontWeight: 700, border: '2px solid #06b6d4' } : {} }) }) }), _jsx(TableCell, { children: _jsx(Chip, { label: u.is_active ? 'Активен' : 'Неактивен', color: u.is_active ? 'success' : 'default', size: "small" }) }), _jsx(TableCell, { children: new Date(u.created_at).toLocaleDateString() }), _jsxs(TableCell, { children: [_jsx(IconButton, { onClick: () => handleOpenEditDialog(u), children: _jsx(EditIcon, {}) }), _jsx(IconButton, { color: "error", onClick: () => handleDeleteUser(u.id), children: _jsx(DeleteIcon, {}) })] })] }, u.id));
                            }) })] }) }), _jsxs(Dialog, { open: openAddDialog, onClose: handleCloseAddDialog, children: [_jsx(DialogTitle, { children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0432 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" }), _jsxs(DialogContent, { sx: { minWidth: 400, pt: '20px !important' }, children: [_jsxs(FormControl, { fullWidth: true, sx: { mb: 2 }, children: [_jsx(InputLabel, { children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C" }), _jsx(Select, { value: newUserForm.user_id, onChange: (e) => setNewUserForm({ ...newUserForm, user_id: e.target.value }), children: allUsers.map((user) => (_jsx(MenuItem, { value: user.id, children: user.email }, user.id))) })] }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "\u0420\u043E\u043B\u044C" }), _jsx(Select, { value: newUserForm.role, onChange: (e) => setNewUserForm({ ...newUserForm, role: e.target.value }), children: PLATFORM_ROLES.map((role) => (_jsx(MenuItem, { value: role.value, children: role.label }, role.value))) })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseAddDialog, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { onClick: handleAddUser, variant: "contained", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" })] })] }), _jsxs(Dialog, { open: openEditDialog, onClose: handleCloseEditDialog, children: [_jsx(DialogTitle, { children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" }), _jsxs(DialogContent, { sx: { minWidth: 400, pt: '20px !important' }, children: [_jsx(TextField, { margin: "dense", label: "Email", type: "email", fullWidth: true, value: editForm.email, onChange: e => setEditForm({ ...editForm, email: e.target.value }), sx: { mb: 2 } }), _jsx(TextField, { margin: "dense", label: "\u041F\u0430\u0440\u043E\u043B\u044C", type: "password", fullWidth: true, value: editForm.password, onChange: e => setEditForm({ ...editForm, password: e.target.value }), sx: { mb: 2 }, placeholder: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u043C\u0435\u043D\u044F\u0442\u044C" }), _jsxs(FormControl, { fullWidth: true, sx: { mb: 2 }, children: [_jsx(InputLabel, { children: "\u0420\u043E\u043B\u044C" }), _jsx(Select, { value: editForm.role, onChange: e => setEditForm({ ...editForm, role: e.target.value }), children: PLATFORM_ROLES.map((role) => (_jsx(MenuItem, { value: role.value, children: role.label }, role.value))) })] }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: editForm.is_active, onChange: e => setEditForm({ ...editForm, is_active: e.target.checked }) }), label: editForm.is_active ? 'Активен' : 'Заблокирован', sx: { mb: 2 } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseEditDialog, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { onClick: handleEditUser, variant: "contained", children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] })] })] }));
};
export default PlatformUsersTable;
