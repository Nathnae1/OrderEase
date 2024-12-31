import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

import { useState } from "react";
import './LoginStyle.css';
import api from './api';

function LoginCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      login();
      navigate('/dashboard'); // Redirect to a protected page
    } catch (error) {
      setError('Login failed');
    }
  };
  

  return (
   <>
    <div className="arc-bg">      
    </div>
    <div className="login-card">
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div> 
        <button type="submit">Login</button>      
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  </>
  );
}

export default LoginCard;