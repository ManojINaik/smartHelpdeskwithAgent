import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const res = await api.get('/api/admin/users');
    setUsers(res.data.users);
    setLoading(false);
  })(); }, []);

  const setRole = async (id: string, role: 'admin'|'agent'|'user') => {
    await api.put(`/api/admin/users/${id}/role`, { role });
    setUsers(u => u.map(x => x._id === id ? { ...x, role } : x));
  };

  if (loading) return <AdminLayout title="Users"><div className="p-2 text-gray-600">Loading...</div></AdminLayout>;
  return (
    <AdminLayout title="Users">
      <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg text-sm shadow-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2"/>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="border-t last:border-b">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">
                <select value={u.role} onChange={e => setRole(u._id, e.target.value as any)} className="rounded border px-2 py-1">
                  <option value="user">user</option>
                  <option value="agent">agent</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
};

export default AdminUsers;



