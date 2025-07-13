const db = require('../db');

const createComment = async (req, res) => {
  const { id: postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    await db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content]
    );
    res.status(201).json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCommentsByPost = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const [comments] = await db.query(`
      SELECT comments.id, comments.content, comments.created_at,
             users.id as user_id, users.name, users.email
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at ASC
    `, [postId]);

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createComment,
  getCommentsByPost
};
