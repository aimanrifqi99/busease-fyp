// admin/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  //const { user, login } = useContext(AuthContext);

  //const navigate = useNavigate();

  /*useEffect(() => {
    if (user && user.token && user.isAdmin) {
      navigate('/admin');
    }
  }, [user, navigate]);*/
  const { login } = useContext(AuthContext);

  const handleLogin = (e) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;