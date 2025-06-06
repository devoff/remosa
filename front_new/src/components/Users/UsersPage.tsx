import React, { useState, useEffect } from 'react';
import { useApi } from '../../lib/useApi';
import { User, UserCreate, UserLimits, UserUpdate, UserLimitsUpdate } from '../../types';
import { hasRole, getUserRole } from '../../utils/auth';

const UsersPage: React.FC = () => {
  const { get, post, put, remove } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [editUserData, setEditUserData] = useState<UserUpdate>({});
  const [editUserLimits, setEditUserLimits] = useState<UserLimitsUpdate>({});
  const currentUserRole = getUserRole();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await get('/api/v1/users/');
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole(["admin", "superuser"])) {
        fetchUsers();
    } else {
        setError("You do not have permission to view this page.");
        setLoading(false);
    }
  }, []);

  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUserData({ ...newUserData, [e.target.name]: e.target.value });
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await post('/api/v1/users/', newUserData);
      setShowAddUserModal(false);
      setNewUserData({ username: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditUserData({ ...editUserData, [e.target.name]: e.target.value });
  };

  const handleEditLimitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUserLimits({ ...editUserLimits, [e.target.name]: parseInt(e.target.value) });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedUser) return;

    try {
      // Update user details
      await put(`/api/v1/users/${selectedUser.id}`, editUserData);

      // Update user limits
      await put(`/api/v1/users/${selectedUser.id}/limits`, editUserLimits);

      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setError(null);
      try {
        await remove(`/api/v1/users/${userId}`);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserData({ 
        username: user.username, 
        email: user.email,
        is_active: user.is_active,
        role: user.role
    });
    // Fetch user limits separately
    const fetchLimits = async () => {
        try {
            const limits: UserLimits = await get(`/api/v1/users/${user.id}/limits`);
            setEditUserLimits({
                max_devices: limits.max_devices,
                max_sms_messages: limits.max_sms_messages,
            });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to fetch user limits');
            setEditUserLimits({ max_devices: 0, max_sms_messages: 0 }); // Fallback
        }
    };
    fetchLimits();
    setShowEditUserModal(true);
  };

  if (loading) {
    return <div className="p-4 text-gray-300">Loading users...</div>;
  }

  if (error && !hasRole(["admin", "superuser"])) {
    return <div className="p-4 text-red-500">Error: {error}</div>; // Display error for unauthorized users
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">User Management</h2>
      
      {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}

      {hasRole(["admin", "superuser"]) && (
        <button
          onClick={() => setShowAddUserModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Add New User
        </button>
      )}

      {loading ? (
        <p className="text-gray-300">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-300">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Username</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Role</th>
                <th className="py-3 px-6 text-left">Active</th>
                <th className="py-3 px-6 text-left">Max Devices</th>
                <th className="py-3 px-6 text-left">Max SMS</th>
                <th className="py-3 px-6 text-left">SMS Sent (Current Period)</th>
                <th className="py-3 px-6 text-left">SMS Period Start</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-400 text-sm font-light">
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{user.id}</td>
                  <td className="py-3 px-6 text-left">{user.username}</td>
                  <td className="py-3 px-6 text-left">{user.email || 'N/A'}</td>
                  <td className="py-3 px-6 text-left">{user.role}</td>
                  <td className="py-3 px-6 text-left">{user.is_active ? 'Yes' : 'No'}</td>
                  {/* Displaying limits from a dummy or fetched source for now */}
                  <td className="py-3 px-6 text-left">{user.user_limits?.max_devices ?? 'Loading...'}</td>
                  <td className="py-3 px-6 text-left">{user.user_limits?.max_sms_messages ?? 'Loading...'}</td>
                  <td className="py-3 px-6 text-left">{user.user_limits?.sms_messages_sent_current_period ?? 'Loading...'}</td>
                  <td className="py-3 px-6 text-left">{user.user_limits?.sms_period_start_date ? new Date(user.user_limits.sms_period_start_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-3 px-6 text-center">
                    {hasRole(["admin", "superuser"]) && (
                      <>
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Add New User</h3>
            <form onSubmit={handleAddUserSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">Username:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newUserData.username}
                  onChange={handleAddUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUserData.email || ''}
                  onChange={handleAddUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUserData.password}
                  onChange={handleAddUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-gray-300 text-sm font-bold mb-2">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={newUserData.role}
                  onChange={handleAddUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Edit User: {selectedUser.username}</h3>
            <form onSubmit={handleEditUserSubmit}>
              <div className="mb-4">
                <label htmlFor="editUsername" className="block text-gray-300 text-sm font-bold mb-2">Username:</label>
                <input
                  type="text"
                  id="editUsername"
                  name="username"
                  value={editUserData.username || ''}
                  onChange={handleEditUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editEmail" className="block text-gray-300 text-sm font-bold mb-2">Email:</label>
                <input
                  type="email"
                  id="editEmail"
                  name="email"
                  value={editUserData.email || ''}
                  onChange={handleEditUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editPassword" className="block text-gray-300 text-sm font-bold mb-2">Password (leave blank to keep current):</label>
                <input
                  type="password"
                  id="editPassword"
                  name="password"
                  value={editUserData.password || ''}
                  onChange={handleEditUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editRole" className="block text-gray-300 text-sm font-bold mb-2">Role:</label>
                <select
                  id="editRole"
                  name="role"
                  value={editUserData.role || 'user'}
                  onChange={handleEditUserChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="editIsActive" className="block text-gray-300 text-sm font-bold mb-2">Is Active:</label>
                <input
                  type="checkbox"
                  id="editIsActive"
                  name="is_active"
                  checked={editUserData.is_active ?? true}
                  onChange={(e) => setEditUserData({ ...editUserData, is_active: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
              </div>

              <h4 className="text-md font-semibold mb-2 text-gray-200">User Limits:</h4>
              <div className="mb-4">
                <label htmlFor="editMaxDevices" className="block text-gray-300 text-sm font-bold mb-2">Max Devices:</label>
                <input
                  type="number"
                  id="editMaxDevices"
                  name="max_devices"
                  value={editUserLimits.max_devices ?? 0}
                  onChange={handleEditLimitsChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editMaxSmsMessages" className="block text-gray-300 text-sm font-bold mb-2">Max SMS Messages:</label>
                <input
                  type="number"
                  id="editMaxSmsMessages"
                  name="max_sms_messages"
                  value={editUserLimits.max_sms_messages ?? 0}
                  onChange={handleEditLimitsChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-gray-200 border-gray-600"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 