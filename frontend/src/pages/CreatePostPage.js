import { useState } from 'react';
import axios from 'axios';

const CreatePostPage = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = '';

      if (image) {
        const formData = new FormData();
        formData.append('image', image);

        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:5000/api/upload/image', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        imageUrl = res.data.image_url;
      }

      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/posts',
        { content, image_url: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Đăng bài thành công!');
      setContent('');
      setImage(null);
    } catch (err) {
      console.error('Lỗi đăng bài:', err);
      alert('Đăng bài thất bại!');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>Đăng bài mới</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nội dung bài viết..."
          rows={5}
          style={{ width: '100%' }}
          required
        />
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
        <br />
        <button type="submit">Đăng bài</button>
      </form>
    </div>
  );
};

export default CreatePostPage;
