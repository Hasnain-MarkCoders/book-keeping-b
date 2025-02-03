
const Payment = require("../models/Payment");
const { convertToObjectIdArray } = require("../utils/helper");
const { responseFormatter } = require("../utils/responseFormatter");
exports.trackPayments = async (req, res) => {
    try {
      const payments = await Payment.find().populate('customerId bookId');
      res.status(200).json(responseFormatter("Payment details fetched", payments, true));
    } catch (error) {
      res.status(500).json(responseFormatter("Error fetching payments", error.message, false));
    }
  };

  exports.returnBook = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.body;
  
      if (!id || (Array.isArray(id) && id.length === 0)) {
        return res.status(400).json(responseFormatter("Book ID(s) are required", null, false));
      }
  
      // Convert book IDs to ObjectId array using the reusable function
      const objectIdBookIds = convertToObjectIdArray(id);
  
      if (objectIdBookIds.length === 0) {
        return res.status(400).json(responseFormatter("Invalid Book ID(s)", null, false));
      }
  
      // Fetch pending returns
      const payments = await Payment.find({
        customerId: userId,
        bookId: { $in: objectIdBookIds },
        returned: false
      });
  
      if (!payments.length) {
        return res.status(404).json(responseFormatter("No pending returns found", null, false));
      }
  
      let booksWithDues = [];
      let successfullyReturnedBooks = [];
  
      payments.forEach(payment => {
        if (payment.totalCharge > 0) {
          booksWithDues.push(payment.bookId);
        } else {
          payment.returned = true;
          successfullyReturnedBooks.push(payment.bookId);
        }
      });
  
      // Save updated payment records for returned books
      await Promise.all(payments.map(payment => payment.save()));
  
      if (booksWithDues.length > 0) {
        let message = `Clear dues before returning these books: ${booksWithDues.join(", ")}.`;
        if (successfullyReturnedBooks.length === 0) {
          return res.status(400).json(responseFormatter(message, null, false));
        }
        return res.status(200).json(responseFormatter(`${message} However, these books were returned successfully: ${successfullyReturnedBooks.join(", ")}.`, { returned: successfullyReturnedBooks, pending: booksWithDues }, true));
      }
  
      res.status(200).json(responseFormatter("All books returned successfully", { returned: successfullyReturnedBooks }, true));
  
    } catch (error) {
      res.status(500).json(responseFormatter("Error returning books", error.message, false));
    }
  };
  