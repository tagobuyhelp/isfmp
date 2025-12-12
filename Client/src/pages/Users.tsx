import { useState } from 'react';
import { Plus, Search, Download } from 'lucide-react';
import UserRow from '../components/UserRow';
import UserModal from '../components/UserModal';

interface User {
  _id: { $oid: string };
  email: string;
  fullname: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4444';

const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Example data - replace with actual API call
  const users: User[] = [
    {
      _id: { $oid: "672eca10661c7e52760526ca" },
      email: "tarikazizb@gmail.com",
      fullname: "Tarik Aziz",
      createdAt: { $date: "2024-11-09T02:33:52.269Z" },
      updatedAt: { $date: "2024-11-09T02:33:52.269Z" }
    }
  ];

  const handleAddUser = async (data: { email: string; fullname: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user');
      }

      setIsModalOpen(false);
      // Refresh users list
    } catch (error) {
      console.error('Error adding user:', error);
      alert(error instanceof Error ? error.message : 'Failed to add user. Please try again.');
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      if (data.currentPassword && data.newPassword) {
        // Handle password change
        const response = await fetch(`${API_BASE_URL}/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to change password');
        }
      }

      // Handle other user data updates if needed
      // You might need to implement an additional endpoint for updating user details

      setEditUser(null);
      // Refresh users list
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user');
        }

        // Refresh users list
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete user. Please try again.');
      }
    }
  };

  const handleExport = () => {
    const csvData = users.map(user => ({
      'Full Name': user.fullname,
      'Email': user.email,
      'Created Date': new Date(user.createdAt.$date).toLocaleDateString(),
      'Last Updated': new Date(user.updatedAt.$date).toLocaleDateString()
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    return user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-300 hover:bg-gray-50"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user._id.$oid}
                  user={user}
                  onEdit={() => setEditUser(user)}
                  onDelete={() => handleDeleteUser(user._id.$oid)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen || !!editUser}
        onClose={() => {
          setIsModalOpen(false);
          setEditUser(null);
        }}
        onSubmit={editUser ? handleUpdateUser : handleAddUser}
        user={editUser}
      />
    </div>
  );
};

export default Users;