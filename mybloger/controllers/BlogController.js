


const Post = require('../models/PostModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Helper function for error responses
const errorResponse = (res, status, message, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    ...(errors && { errors })
  });

};

exports.getAuthorPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exclude, limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    const query = { author: userId };
    if (exclude) {
      query._id = { $ne: exclude };
    }

    const posts = await Post.find(query)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Transform image URLs
    const transformedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.image?.startsWith('http') ? post.image : 
               `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`
    }));

    res.status(200).json({
      success: true,
      data: transformedPosts
    });
  } catch (error) {
    console.error('Get author posts error:', error);
    errorResponse(res, 500, 'Failed to fetch author posts');
  }
};

// Get all posts with pagination and search
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(query)
    ]);

    // Transform image URLs
    const transformedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.image?.startsWith('http') ? post.image : 
               `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`
    }));

    res.status(200).json({
      success: true,
      count: transformedPosts.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: transformedPosts
    });
  } catch (error) {
    console.error('Get Posts Error:', error);
    errorResponse(res, 500, 'Failed to fetch posts');
  }
};



// blogController.js
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID format' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    const newComment = {
      text: content,
      author: userId
    };

    post.comments.push(newComment);
    await post.save();

    // Populate author info before sending response
    const populatedPost = await Post.findById(postId)
      .populate('comments.author', 'name avatar');

    const addedComment = populatedPost.comments.find(
      c => c._id.toString() === newComment._id.toString()
    );

    res.status(201).json({
      success: true,
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add comment' 
    });
  }
};

// Get single post with view increment
exports.getSinglePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Invalid post ID format');
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
    .populate('author', 'name avatar bio followers following')
    .populate({
      path: 'comments.author',
      select: 'name avatar'
    })
    .populate('likedBy', 'name avatar')
    .lean();

    if (!post) {
      return errorResponse(res, 404, 'Post not found');
    }

    // Transform image URL
    if (post.image && !post.image.startsWith('http')) {
      post.imageUrl = `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`;
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get Single Post Error:', error);
    errorResponse(res, 500, 'Failed to fetch post');
  }
};

exports.createPost = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    console.log('Request file:', req.file); // Debug log

    // Validate required fields
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
        receivedFields: {
          title: !!req.body.title,
          content: !!req.body.content,
          image: !!req.file
        }
      });
    }

    // Create new post
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user._id,
      image: req.file?.path
    });

    const savedPost = await newPost.save();

    // Transform response to match frontend expectations
    const responseData = savedPost.toObject();
    responseData.id = responseData._id;
    delete responseData._id;

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: responseData
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};


exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const posts = await Post.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'name avatar');
      
    const total = await Post.countDocuments();
    
    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(400).json({ 
      success: false,
      message: 'Invalid request parameters',
      error: error.message
    });
  }
};
// Add comment to a post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return errorResponse(res, 400, 'Invalid post ID');
    }

    if (!text || text.trim().length < 2) {
      return errorResponse(res, 400, 'Comment must be at least 2 characters');
    }

    const comment = {
      text: text.trim(),
      author: userId
    };

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment } },
      { new: true }
    ).populate({
      path: 'comments.author',
      select: 'name avatar'
    });

    if (!post) {
      return errorResponse(res, 404, 'Post not found');
    }

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    errorResponse(res, 500, 'Failed to add comment');
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

// Get author's posts
exports.getAuthorPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exclude, limit = 3 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return errorResponse(res, 400, 'Invalid user ID');
    }

    const query = { author: userId };
    if (exclude) {
      query._id = { $ne: exclude };
    }

    const posts = await Post.find(query)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Transform image URLs
    const transformedPosts = posts.map(post => ({
      ...post,
      imageUrl: post.image?.startsWith('http') ? post.image : 
               `${req.protocol}://${req.get('host')}/${post.image.replace(/\\/g, '/')}`
    }));

    res.status(200).json({
      success: true,
      data: transformedPosts
    });
  } catch (error) {
    console.error('Get author posts error:', error);
    errorResponse(res, 500, 'Failed to fetch author posts');
  }
};

// Increment views (dedicated endpoint)
exports.incrementViews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return errorResponse(res, 400, 'Invalid post ID');
    }

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!post) {
      return errorResponse(res, 404, 'Post not found');
    }

    res.status(200).json({
      success: true,
      views: post.views
    });
  } catch (error) {
    console.error('Increment Views Error:', error);
    errorResponse(res, 500, 'Failed to increment views');
  }
};


// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .select('comments')
      .populate('comments.author', 'name avatar');

    if (!post) {
      return errorResponse(res, 404, 'Post not found');
    }

    res.status(200).json({
      success: true,
      comments: post.comments
    });
  } catch (error) {
    console.error('Get Comments Error:', error);
    errorResponse(res, 500, 'Failed to fetch comments');
  }
};

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    if (!content || content.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment must be at least 2 characters' 
      });
    }

    const comment = {
      text: content.trim(),
      author: userId
    };

    const post = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: comment } },
      { new: true }
    ).populate('comments.author', 'name avatar');

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if already liked
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());
    if (alreadyLiked) {
      return res.status(400).json({ 
        success: false,
        message: 'Post already liked' 
      });
    }

    // Add like
    post.likedBy.push(userId);
    post.likes = post.likedBy.length;
    await post.save();

    res.status(200).json({
      success: true,
      likes: post.likes,
      likedBy: post.likedBy
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if not already liked
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());
    if (!alreadyLiked) {
      return res.status(400).json({ 
        success: false,
        message: 'Post not liked' 
      });
    }

    // Remove like
    post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
    post.likes = post.likedBy.length;
    await post.save();

    res.status(200).json({
      success: true,
      likes: post.likes,
      likedBy: post.likedBy
    });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};


exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('author', 'name avatar')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to prevent overloading

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};


exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId) || 
        !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format' 
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(
      c => c._id.equals(commentId) && 
           (c.author.equals(userId) || req.user.isAdmin)
    );

    if (commentIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found or unauthorized' 
      });
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({ 
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid post ID' 
      });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to delete this post' 
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Optionally: Delete associated comments or files
    // await Comment.deleteMany({ post: postId });

    res.json({ 
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

