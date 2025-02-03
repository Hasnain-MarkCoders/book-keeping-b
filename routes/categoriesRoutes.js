const express = require('express');
const { addCategory, getAllCategories, deleteAllCategories, updateCategory } = require('../controllers/categoryController');
const { upload } = require('../utils/cloudinaryConfig');
const { isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/',isAdmin,upload.single("picture"), addCategory); // Admin only
router.patch('/',isAdmin,upload.single("picture"), updateCategory); // Admin only
router.get('/', getAllCategories); // Public access
router.delete('/',isAdmin, deleteAllCategories); // Public access
module.exports = router;