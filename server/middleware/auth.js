const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify admin still exists and is active
    const admin = await Admin.findById(decoded.id).select('isActive');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Not authorized, account deactivated' });
    }

    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    req.adminLocationId = decoded.locationId || null;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = auth;
