import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      const updated = await api.updateUser(id, { role: newRole });
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (id, currentStatus) => {
    try {
      const updated = await api.updateUser(id, { is_active: !currentStatus });
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Управление пользователями</h2>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.first_name}</td>
                <td>{user.last_name}</td>
                <td>
                  <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)}>
                    <option value="user">user</option>
                    <option value="seller">seller</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{user.is_active ? 'Активен' : 'Заблокирован'}</td>
                <td>
                  <button onClick={() => handleToggleBlock(user.id, user.is_active)}>
                    {user.is_active ? 'Заблокировать' : 'Разблокировать'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}