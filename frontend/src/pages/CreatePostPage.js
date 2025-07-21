import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CreatePostPage.module.css';

const CreatePostPage = () => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const MAX_CHARS = 1000;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleCancel = () => {
    setContent('');
    setImage(null);
    setImagePreview(null);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }

    if (content.length > MAX_CHARS) {
      alert(`Nội dung không được vượt quá ${MAX_CHARS} ký tự!`);
      return;
    }

    setIsLoading(true);

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

      setSuccessMessage('Đăng bài thành công! 🎉');
      setContent('');
      setImage(null);
      setImagePreview(null);
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      // ...existing code...
      alert('Đăng bài thất bại! Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <div className={styles.header}>
          <h1 className={styles.title}>Tạo bài viết mới</h1>
          <p className={styles.subtitle}>Chia sẻ khoảnh khắc đáng nhớ với bạn bè</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Content Textarea */}
          <div className={styles.textareaContainer}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì? Chia sẻ với mọi người..."
              className={styles.textarea}
              maxLength={MAX_CHARS}
              required
            />
            <div className={`${styles.charCount} ${content.length > MAX_CHARS * 0.9 ? styles.warning : ''}`}>
              {content.length}/{MAX_CHARS}
            </div>
          </div>

          {/* Image Upload */}
          <div className={`${styles.uploadSection} ${image ? styles.hasFile : ''}`}>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className={styles.uploadInput}
            />
            
            {!imagePreview ? (
              <>
                <div className={styles.uploadIcon}>📷</div>
                <div className={styles.uploadText}>Thêm ảnh vào bài viết</div>
                <div className={styles.uploadSubtext}>
                  Click để chọn ảnh hoặc kéo thả ảnh vào đây
                </div>
              </>
            ) : (
              <div className={styles.imagePreview}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className={styles.previewImage}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className={styles.removeImageButton}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Hủy bỏ
            </button>
            
            <button
              type="submit"
              className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading || !content.trim() || content.length > MAX_CHARS}
            >
              {isLoading ? 'Đang đăng...' : 'Đăng bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
