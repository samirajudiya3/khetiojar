const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_key');

      // Fetch user from token
      req.user = await User.findUserById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User session expired or not found' });
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: Authentication token required' });
  }
};

module.exports = { protect };
