


const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/PostModel')
const blogController = require('../controllers/BlogController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/FileUpload');
const crypto = require('crypto');

// Public routes
router.get('/all', blogController.getPosts);
router.get('/:id', blogController.getSinglePost);
router.get('/author/:userId/posts', blogController.getAuthorPosts);


// Authenticated routes
router.post(
  '/create',
  authMiddleware,
  upload.single('image'),
  blogController.createPost
);

// Post interactions
router.patch('/:postId/views', blogController.incrementViews);
// Express.js example
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('comments');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
});
// router.post('/:postId/comment', authMiddleware, blogController.addComment);
router.get('/comments/all', blogController.getAllComments);


// In your backend routes (blogRoutes.js)
router.post('/:postId/comments', authMiddleware, blogController.addComment);


router.post('/:postId/like', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if already liked
    if (post.likedBy.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post already liked',
        likes: post.likes,
        likedBy: post.likedBy
      });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { likes: 1 },
        $addToSet: { likedBy: userId }
      },
      { new: true }
    ).select('likes likedBy');

    res.json({
      success: true,
      message: 'Post liked successfully',
      likes: updatedPost.likes,
      likedBy: updatedPost.likedBy
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:postId/unlike', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if not liked
    if (!post.likedBy.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post not liked yet',
        likes: post.likes,
        likedBy: post.likedBy
      });
    }

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: { likes: -1 },
        $pull: { likedBy: userId }
      },
      { new: true }
    ).select('likes likedBy');

    res.json({
      success: true,
      message: 'Post unliked successfully',
      likes: updatedPost.likes,
      likedBy: updatedPost.likedBy
    });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Comment management
router.delete(
  '/:postId/comments/:commentId', 
  authMiddleware,
  blogController.deleteComment
);

router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate the userId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find the user to verify they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found'
      });
    }
    
    // Find posts by this user
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');
    
    res.json({ 
      success: true,
      posts 
    });
    
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching posts'
    });
  }
});

// Make sure you have this route in your backend
router.get('/api/blog/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post management
router.delete(
  '/:postId', 
  authMiddleware,
  blogController.deletePost
);

module.exports = router;