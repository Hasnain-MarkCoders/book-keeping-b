// routes/adminRoutes.js
const express = require('express');
const { signup, login } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', isAdmin, signup); // Only admins can create other admins
router.post('/signup', isAdmin, signup); // Only admins can create other admins

router.post('/login', login);

module.exports = router;