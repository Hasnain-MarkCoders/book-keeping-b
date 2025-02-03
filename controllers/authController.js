// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { responseFormatter } = require('../utils/responseFormatter');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
    res.status(201).json(responseFormatter("Signup successful", { token, customer }, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error during signup", error.message, false));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ email });
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json(responseFormatter("Invalid credentials", null, false));
    }
    const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
    res.status(200).json(responseFormatter("Login successful", { token, customer }, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error during login", error.message, false));
  }
};