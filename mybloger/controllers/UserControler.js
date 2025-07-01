

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const Post = require('../models/PostModel');

async function registerUser(req, res){
  try {
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        invalidFields: ['email']
      });
    }

    // Validate password length
    if (req.body.password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
        invalidFields: ['password']
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        invalidFields: ['email']
      });
    }

    // Create user
    const user = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name || '', // Optional field
      email: req.body.email,
      password: req.body.password
    });

    // Return response without password
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// In your login controller
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Case-insensitive email search
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    }).select('+password');

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        detail: 'USER_NOT_FOUND'
      });
    }

    console.log('User found, comparing passwords...');
    const isMatch = await bcryptjs.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password comparison failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        detail: 'PASSWORD_MISMATCH'
      });
    }

    console.log('Generating JWT token...');
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful for user:', user._id);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name
      }
    });

  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

async function refreshToken(req, res){
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const newToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};


// In your login controller
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  return jwt.sign(
    {
      id: user._id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    secret,
    { algorithm: 'HS256' }
  );
};

// const handleFollow = async () => {
//   try {
//     // Get current user reliably
//     const currentUser = user || JSON.parse(localStorage.getItem('user')) || null;
    
//     if (!currentUser?._id) {
//       toast.error('Please login to follow users');
//       navigate('/login');
//       return;
//     }

//     if (!currentPost?.author?._id) {
//       toast.error('Author information not available');
//       return;
//     }

//     if (currentUser._id === currentPost.author._id) {
//       toast.error("You can't follow yourself");
//       return;
//     }

//     // Optimistic UI update
//     const newFollowStatus = !isFollowing;
//     setIsFollowing(newFollowStatus);

//     // Make API call
//     const endpoint = `/api/users/${currentPost.author._id}/${newFollowStatus ? 'follow' : 'unfollow'}`;
//     const response = await api.post(endpoint);

//     // Update global user state if needed
//     if (updateUserFollowing) {
//       updateUserFollowing(currentPost.author._id, newFollowStatus);
//     }

//     toast.success(newFollowStatus ? 'Successfully followed user' : 'Successfully unfollowed user');
    
//   } catch (error) {
//     // Revert on error
//     setIsFollowing(prev => !prev);
    
//     console.error('Follow error:', error);
//     if (error.response?.status === 401) {
//       toast.error('Session expired. Please login again');
//       navigate('/login');
//     } else {
//       toast.error(error.response?.data?.message || 'Failed to update follow status');
//     }
//   }
// };


exports.getSingleUser = async (req, res) => {
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

async function fetchAuthorPosts(authorId) {
  try {
    const response = await axios.get(`/api/authors/${authorId}/posts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching author posts:', error);
    throw error;
  }
}


async function followUser(req, res){
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if trying to follow self
    if (userId === followerId.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Update both users
    const [updatedUser, updatedFollower] = await Promise.all([
      User.findByIdAndUpdate(
        userId,
        { $addToSet: { followers: followerId } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        followerId,
        { $addToSet: { following: userId } },
        { new: true }
      )
    ]);

    res.json({
      success: true,
      followersCount: updatedUser.followers.length,
      followingCount: updatedFollower.following.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get current user profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('followers following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user profile (public)
const getsingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('followers following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user.id);
      isFollowing = currentUser.following.includes(user._id);
    }

    res.status(200).json({ ...user.toObject(), isFollowing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updatUser = async (req, res) => {
  try {
    const { username, first_name, last_name, bio } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last
    _name;
    if (bio) updates.bio = bio;
    if (req.file) updates.avatar = req.file.path;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user account
const deletsingleUser = async (req, res) => {
  try {
    // First delete all user posts
    await Post.deleteMany({ author: req.user.id });

    // Then delete the user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// In your UserController.js
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        first_name: user.first_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getsingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        first_name: user.first_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};







const unfollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if not following
    if (!currentUser.following.includes(targetUserId)) {
      return res.status(400).json({ 
        success: false,
        message: "Not following this user" 
      });
    }

    // Remove from following list
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== targetUserId
    );
    await currentUser.save();

    // Remove from target user's followers
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== currentUserId
    );
    await targetUser.save();

    res.status(200).json({ 
      success: true,
      message: "Successfully unfollowed user",
      following: currentUser.following
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};





const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exclude, limit = 3 } = req.query;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Build query
    const query = { author: userId };
    if (exclude) {
      query._id = { $ne: exclude };
    }

    const posts = await post.find(query)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar')
      .lean();

    res.json({
      success: true,
      posts: posts || []
    });

  } catch (err) {
    console.error('Error in getUserPosts:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts'
    });
  }
};
module.exports = {
  registerUser,
  loginUser,
  getUser,
  getsingleUser,
  updatUser,
  deletsingleUser,
  getUserPosts,
  followUser,
  unfollowUser,
  fetchAuthorPosts
};;




