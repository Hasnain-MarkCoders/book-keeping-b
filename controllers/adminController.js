// controllers/adminController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const { responseFormatter } = require('../utils/responseFormatter');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json(responseFormatter("Admin already exists", null, false));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin
    const admin = await Admin.create({ name, email, password: hashedPassword });

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

    res.status(201).json(responseFormatter("Admin signup successful", { token, admin }, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error during admin signup", error.message, false));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json(responseFormatter("Invalid credentials", null, false));

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json(responseFormatter("Invalid credentials", null, false));

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

    res.status(200).json(responseFormatter("Admin login successful", { token, admin }, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error during admin login", error.message, false));
  }
};