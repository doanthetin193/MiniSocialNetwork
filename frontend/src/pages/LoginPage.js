import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      // Lưu token và user info vào localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Sau khi login và setLocalStorage:
    socket.emit('register', res.data.user.id);

      alert('Đăng nhập thành công!');
      navigate('/'); // chuyển về trang chủ (hoặc /posts)
    } catch (err) {
      console.error(err);
      alert('Đăng nhập thất bại!');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br /><br />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;
