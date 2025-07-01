// const jwt = require('jsonwebtoken');
// const { JWT_SECRET } = process.env;

// exports.authenticate = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
  
//   if (!token) {
//     return res.status(401).json({ 
//       success: false,
//       message: 'Authentication required' 
//     });
//   }

//   jwt.verify(token, JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Invalid or expired token' 
//       });
//     }
    
//     req.userId = decoded.id;
//     next();
//   });
// };

// // authMiddleware.js
// // const jwt = require('jsonwebtoken');

// module.exports = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = await User.findById(decoded.id).select('-password');
    
//     if (!req.user) {
//       return res.status(401).json({ message: 'User not found' });
//     }

//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };






// // authMiddleware.js
// // const jwt = require('jsonwebtoken');

// module.exports = async (req, res, next) => {
//   try {
//     // Check for token in Authorization header
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Attach user to request
//     req.user = await User.findById(decoded.id).select('-password');
//     if (!req.user) {
//       return res.status(401).json({ message: 'User not found' });
//     }

//     next();
//   } catch (error) {
//     console.error('Auth error:', error.message);
//     return res.status(401).json({ message: 'Not authorized' });
//   }
// };

// // const jwt = require('jsonwebtoken');

// module.exports = function(req, res, next) {
//   // Get token from header
//   const authHeader = req.header('Authorization');
  
//   if (!authHeader) {
//     return res.status(401).json({ 
//       success: false,
//       message: 'No token, authorization denied' 
//     });
//   }

//   // Extract token from "Bearer <token>"
//   const token = authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ 
//       success: false,
//       message: 'Invalid token format' 
//     });
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error('Token verification error:', err.message);
    
//     let message = 'Token is not valid';
//     if (err.name === 'TokenExpiredError') {
//       message = 'Token has expired';
//     } else if (err.name === 'JsonWebTokenError') {
//       message = 'Invalid token';
//     }
    
//     res.status(401).json({ 
//       success: false,
//       message 
//     });
//   }
// };


// // middleware/responseFormatter.js
// module.exports = (req, res, next) => {
//   const originalSend = res.send;
//   const originalJson = res.json;

//   res.json = function(data) {
//     if (data === undefined || data === null) {
//       console.warn('Null response intercepted');
//       data = { success: false, message: 'Empty response' };
//     }
//     originalJson.call(this, data);
//   };

//   res.send = function(data) {
//     if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
//       return originalJson.call(this, data);
//     }
//     originalSend.call(this, data);
//   };

//   next();
// };

// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel'); // Make sure to import your User model

module.exports = async (req, res, next) => {
  try {
    // 1. Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1].trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authentication token'
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Fetch user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // 5. Attach user to request
    req.user = {
      id: user._id.toString(), // Ensure consistent ID format
      _id: user._id,
      ...user._doc // Spread other user properties
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific JWT errors
    let message = 'Authentication failed';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    return res.status(401).json({
      success: false,
      message
    });
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(401).json({ message: 'Not authenticated' });
  }
};