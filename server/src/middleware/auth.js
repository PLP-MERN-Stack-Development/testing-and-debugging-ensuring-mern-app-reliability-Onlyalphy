const { verifyToken } = require('../utils/auth');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // In a real app, you'd verify the JWT token here
    // For now, we'll just extract the user ID from the token
    if (!token) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Mock user authentication - in production, verify the JWT
    req.user = { _id: token.replace('token_', '') };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };