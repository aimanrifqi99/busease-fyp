// src/pages/user/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../../api/userApi';
import { useNavigate } from 'react-router-dom'; 
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await getUsers();
                setUsers(data);
            } catch (err) {
                setError('Failed to fetch users');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteUser(id);
            setUsers(users.filter(user => user._id !== id));
        } catch (err) {
            console.error('Failed to delete user:', err);
            setError('Failed to delete user');
        }
    };

    const handleView = (id) => {
        navigate(`/user/${id}`); // Navigate to UserDetail page
    };

    if (loading) return <div>Loading users...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="userManagement">
            <table className="managementTable">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                                <button onClick={() => handleView(user._id)}>View</button> {/* Updated */}
                                <button onClick={() => handleDelete(user._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;