import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { authAPI } from '../services/api';
import { User } from '../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    role: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ userId: string; user: User; newPassword?: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', role: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAllUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const response = await authAPI.createUser({
        phoneNumber: formData.phoneNumber,
        name: formData.name || undefined,
        role: formData.role as 'ADMIN' | 'TECHNICIAN' | 'LANDLORD',
      });

      setGeneratedPassword(response.generatedPassword || null);
      setFormData({ phoneNumber: '', name: '', role: '' });
      await loadUsers();
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Error creating user');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setGeneratedPassword(null);
    setFormData({ phoneNumber: '', name: '', role: '' });
  };

  const handleResetPassword = async (user: User) => {
    setResetPasswordData({ userId: user.id, user });
    setResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordData) return;

    try {
      setResetLoading(true);
      const response = await authAPI.resetUserPassword(resetPasswordData.userId);
      setResetPasswordData({
        ...resetPasswordData,
        newPassword: response.newPassword
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(error.response?.data?.error || 'Error resetting password');
      setResetPasswordModal(false);
      setResetPasswordData(null);
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setResetPasswordModal(false);
    setResetPasswordData(null);
  };

  const handleEditUser = (user: User) => {
    setEditUserData(user);
    setEditFormData({
      name: user.name || '',
      role: user.role
    });
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData) return;

    try {
      setEditLoading(true);
      await authAPI.updateUser(editUserData.id, {
        name: editFormData.name || undefined,
        role: editFormData.role
      });
      setEditModal(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.error || 'Error updating user');
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditUserData(null);
    setEditFormData({ name: '', role: '' });
  };

  const handleDeleteUser = (user: User) => {
    setDeleteUserData(user);
    setDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserData) return;

    try {
      setDeleteLoading(true);
      await authAPI.deleteUser(deleteUserData.id);
      setDeleteModal(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'Error deleting user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal(false);
    setDeleteUserData(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'TECHNICIAN':
        return 'bg-blue-100 text-blue-800';
      case 'LANDLORD':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const roleOptions = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'TECHNICIAN', label: 'Technician' },
    { value: 'LANDLORD', label: 'Landlord' },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and their roles</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add New User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.phoneNumber}</TableCell>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleResetPassword(user)}
                          >
                            Reset Password
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title="Add New User"
          size="md"
        >
          {generatedPassword ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">User Created Successfully!</h3>
                <p className="text-sm text-green-600 mb-3">
                  The user has been created with the following credentials:
                </p>
                <div className="bg-white border border-green-300 rounded p-3">
                  <p><strong>Phone:</strong> {formData.phoneNumber}</p>
                  <p><strong>Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{generatedPassword}</code></p>
                </div>
                <p className="text-sm text-green-600 mt-3">
                  Please share these credentials securely with the user.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={closeModal}>Close</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="e.g., 0712345678"
                required
              />

              <Input
                label="Full Name (Optional)"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter user's full name"
              />

              <Select
                label="User Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={roleOptions}
                required
              />

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Password Reset Modal */}
        <Modal
          isOpen={resetPasswordModal}
          onClose={closeResetModal}
          title="Reset User Password"
          size="md"
        >
          {resetPasswordData?.newPassword ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">Password Reset Successfully!</h3>
                <p className="text-sm text-green-600 mb-3">
                  A new password has been generated for this user:
                </p>
                <div className="bg-white border border-green-300 rounded p-3">
                  <p><strong>User:</strong> {resetPasswordData.user.name || resetPasswordData.user.phoneNumber}</p>
                  <p><strong>Phone:</strong> {resetPasswordData.user.phoneNumber}</p>
                  <p><strong>New Password:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{resetPasswordData.newPassword}</code></p>
                </div>
                <p className="text-sm text-green-600 mt-3">
                  Please share this new password securely with the user. They should change it after logging in.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={closeResetModal}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Confirm Password Reset</h3>
                <p className="text-sm text-yellow-600 mb-3">
                  Are you sure you want to reset the password for this user? This action cannot be undone.
                </p>
                {resetPasswordData && (
                  <div className="bg-white border border-yellow-300 rounded p-3">
                    <p><strong>User:</strong> {resetPasswordData.user.name || resetPasswordData.user.phoneNumber}</p>
                    <p><strong>Phone:</strong> {resetPasswordData.user.phoneNumber}</p>
                    <p><strong>Role:</strong> {resetPasswordData.user.role}</p>
                  </div>
                )}
                <p className="text-sm text-yellow-600 mt-3">
                  A new random password will be generated and displayed for you to share with the user.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={closeResetModal}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmResetPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={editModal}
          onClose={closeEditModal}
          title="Edit User"
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Phone Number:</strong> {editUserData?.phoneNumber} (cannot be changed)
              </p>
            </div>

            <Input
              label="Full Name"
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="Enter user's full name"
            />

            <Select
              label="User Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              options={roleOptions}
              required
            />

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={editLoading}>
                {editLoading ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete User Modal */}
        <Modal
          isOpen={deleteModal}
          onClose={closeDeleteModal}
          title="Delete User"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">Confirm User Deletion</h3>
              <p className="text-sm text-red-600 mb-3">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              {deleteUserData && (
                <div className="bg-white border border-red-300 rounded p-3">
                  <p><strong>User:</strong> {deleteUserData.name || deleteUserData.phoneNumber}</p>
                  <p><strong>Phone:</strong> {deleteUserData.phoneNumber}</p>
                  <p><strong>Role:</strong> {deleteUserData.role}</p>
                  <p><strong>Created:</strong> {new Date(deleteUserData.createdAt).toLocaleDateString()}</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-3">
                <strong>Warning:</strong> This will also affect any related data (meters, readings, bills) associated with this user.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarLayout>
  );
};

export default Users;