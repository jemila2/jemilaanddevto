






const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const Post = require('../models/PostModel'); 
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUser,
  getsingleUser,
  updatUser,
  deletsingleUser,
  followUser,
  unfollowUser,
  getUserPosts
} = require('../controllers/UserControler');

// Authentication routes
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email',
        detail: 'EMAIL_NOT_FOUND'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
        detail: 'PASSWORD_MISMATCH'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user data without password
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Registration route
router.post('/create', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    // Check if user exists (case-insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      first_name,
      last_name
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:userId/follow', authMiddleware, followUser);
router.post('/:userId/unfollow', authMiddleware, unfollowUser);

router.post('/:userId/:action', async (req, res) => {
  try {
    const { userId, action } = req.params;
    const currentUserId = req.user._id;

    // Your follow/unfollow logic here
    // ...

    res.json({
      success: true,
      message: `${action} successful`,
      followersCount: updatedUser.followers.length,
      isFollowing: action === 'follow',
      updatedFollowers: updatedUser.followers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// router.post('/:userId/follow', authMiddleware, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const followerId = req.user._id;

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ 
//         message: 'Invalid user ID',
//         invalidId: userId
//       });
//     }

//     // Check if users exist
//     const [userToFollow, follower] = await Promise.all([
//       User.findById(userId),
//       User.findById(followerId)
//     ]);

//     if (!userToFollow || !follower) {
//       return res.status(404).json({ 
//         message: "User not found",
//         details: {
//           targetUserExists: !!userToFollow,
//           followerExists: !!follower
//         }
//       });
//     }

//     // Check existing relationship
//     const alreadyFollowing = userToFollow.followers.some(id => 
//       id.toString() === followerId.toString()
//     );

//     if (alreadyFollowing) {
//       return res.status(400).json({ 
//         message: "Already following this user",
//         existingRelationship: true
//       });
//     }

//     // Perform updates without transaction
//     await Promise.all([
//       User.findByIdAndUpdate(
//         userId,
//         { $addToSet: { followers: followerId } },
//         { new: true }
//       ),
//       User.findByIdAndUpdate(
//         followerId,
//         { $addToSet: { following: userId } },
//         { new: true }
//       )
//     ]);

//     return res.json({ 
//       success: true,
//       message: 'Successfully followed user'
//     });

//   } catch (error) {
//     console.error('Follow error:', error);
//     return res.status(500).json({ 
//       message: "Operation failed",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// router.post('/:userId/unfollow', authMiddleware, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const followerId = req.user._id;

//     // Validate IDs
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: 'Invalid user ID' });
//     }

//     // Check if users exist
//     const [userToUnfollow, follower] = await Promise.all([
//       User.findById(userId),
//       User.findById(followerId)
//     ]);

//     if (!userToUnfollow || !follower) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Perform updates
//     await Promise.all([
//       User.findByIdAndUpdate(
//         followerId,
//         { $pull: { following: userId } },
//         { new: true }
//       ),
//       User.findByIdAndUpdate(
//         userId,
//         { $pull: { followers: followerId } },
//         { new: true }
//       )
//     ]);

//     res.json({ success: true });

//   } catch (error) {
//     console.error('Unfollow error:', error);
//     res.status(500).json({ 
//       message: 'Server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// User posts route
router.get('/:userId/posts', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId format if using MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Fetch posts
    const posts = await Post.find({ author: userId })
      .sort('-createdAt')
      .select('title createdAt views');
    
    res.json({ success: true, posts });
    
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ 
      message: 'Server error while fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Basic CRUD routes
router.get('/me', authMiddleware, getUser);
router.get('/:id', authMiddleware, getsingleUser);
router.put('/', authMiddleware, updatUser);
router.delete('/', authMiddleware, deletsingleUser);

module.exports = router;




