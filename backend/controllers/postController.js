const db = require('../db');

const createPost = async (req, res) => {
  const { content, image_url } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [userId, content, image_url || null]
    );
    res.status(201).json({ message: 'Post created successfully' });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT posts.id, posts.content, posts.image_url, posts.created_at,
             users.id as user_id, users.name, users.email
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    const [posts] = await db.query(`
      SELECT id, content, image_url, created_at
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json(posts);
  } catch (err) {
    console.error('Error fetching my posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { content, image_url } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'UPDATE posts SET content = ?, image_url = ? WHERE id = ? AND user_id = ?',
      [content, image_url || null, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Unauthorized or post not found' });
    }

    res.json({ message: 'Post updated successfully' });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Unauthorized or post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getMyPosts,
  updatePost,
  deletePost
};
