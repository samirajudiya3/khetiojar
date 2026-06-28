const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_jwt_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username and password' });
    }

    const user = await User.findUserByUsername(username);

    if (user && (await User.matchPassword(password, user.password))) {
      return res.json({
        success: true,
        token: generateToken(user.id),
        user: {
          id: user.id,
          username: user.username
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Access denied.' });
    }
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

module.exports = { loginUser };
