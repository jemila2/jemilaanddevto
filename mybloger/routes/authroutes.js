


// // routes/auth.js
// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/UserModel');


// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization').replace('Bearer ', '');
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

//     if (!user) {
//       throw new Error();
//     }

//     req.token = token;
//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ 
//       success: false,
//       message: 'Please authenticate' 
//     });
//   }
// };

// // Verify endpoint
// router.get('/verify', auth, (req, res) => {
//   res.json({
//     success: true,
//     user: {
//       _id: req.user._id,
//       email: req.user.email,
//       name: req.user.name
//     }
//   });
// });

// module.exports = router;





const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken
} = require('../controllers/AuthController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

module.exports = router;
