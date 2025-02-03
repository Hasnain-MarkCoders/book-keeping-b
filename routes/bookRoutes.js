const express = require('express');
const { addBook, getAllBooks, rentBook, deleteAllBooks, updateBook, deleteBook } = require('../controllers/bookController');
const { upload } = require('../utils/cloudinaryConfig');
const { isAdmin, authenticateUser } = require('../middleware/authMiddleware');
const router = express.Router();
router.post('/',isAdmin,upload.single("picture"), addBook); // Admin only
router.patch('/',isAdmin,upload.single("picture"), updateBook); // Admin only
router.get('/', getAllBooks); // Public access
router.delete('/',isAdmin, deleteAllBooks); // Public access
router.delete('/:bookId',isAdmin, deleteBook); // Public access

router.post('/rent',authenticateUser, rentBook); // Customer auth required


module.exports = router;
