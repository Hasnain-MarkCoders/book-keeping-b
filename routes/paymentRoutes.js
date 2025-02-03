const express = require('express');
const {trackPayments, returnBook} = require('../controllers/paymentController');
const { isAdmin, authenticateUser } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', isAdmin,trackPayments);
router.post('/return', authenticateUser,returnBook);



module.exports = router;