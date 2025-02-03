// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/admin');

exports.authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No token provided", success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);
    if (!customer) return res.status(401).json({ message: "Invalid token", success: false });

    req.user = { id: customer._id, role: 'customer' }; // Attach user info to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed", success: false });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token)
    if (!token) return res.status(401).json({ message: "No token provided", success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id); // Assuming you have an Admin model
    if (!admin) return res.status(403).json({ message: "Admin access denied", success: false });

    req.user = { id: admin._id, role: 'admin' }; // Attach admin info to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed", success: false });
  }
};