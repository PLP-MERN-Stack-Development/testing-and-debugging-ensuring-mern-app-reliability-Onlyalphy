const generateToken = (user) => {
  // Simple token generation - in production use JWT
  return `token_${user._id}`;
};

module.exports = { generateToken };