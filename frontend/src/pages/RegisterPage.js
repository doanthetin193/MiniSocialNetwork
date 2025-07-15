import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert('Đăng ký thất bại');
    }
  };

  return (
    <div>
      <h2>Đăng ký</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Tên" value={formData.name} onChange={handleChange} required />
        <br />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <br />
        <input type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} required />
        <br />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default RegisterPage;
