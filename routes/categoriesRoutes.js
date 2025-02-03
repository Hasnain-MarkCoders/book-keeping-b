const express = require('express');
const { addCategory, getAllCategories, deleteAllCategories, updateCategory, deleteCategory, getACategory } = require('../controllers/categoryController');
const { upload } = require('../utils/cloudinaryConfig');
const { isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/',isAdmin,upload.single("picture"), addCategory); // Admin only
router.patch('/',isAdmin,upload.single("picture"), updateCategory); // Admin only
router.get('/', getAllCategories); // Public access
router.get('/:categoryId', getACategory); // Public access

router.delete('/',isAdmin, deleteAllCategories); 
router.post('/delete',isAdmin, deleteCategory); 
module.exports = router;