const Book = require('../models/book');
const { responseFormatter } = require('../utils/responseFormatter');
const { cloud_upload } = require('../utils/cloudinaryConfig');
const { convertToObjectIdArray } = require('../utils/helper');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Category = require('../models/Category');

exports.addBook = async (req, res) => {
  try {
    const { name, price, isDonate, isRental, stockInInventory, id, author, ISBN } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json(responseFormatter("Image is required", null, false));

    const uploadImage = await cloud_upload.upload(file.path);
    if (!uploadImage) return res.status(400).json(responseFormatter("Failed to upload book image", null, false));

    // Convert category IDs to ObjectId array
    const categoryIds = convertToObjectIdArray(id);

    if (!categoryIds.length) {
      return res.status(400).json(responseFormatter("Valid category IDs are required", null, false));
    }

    // Fetch categories where the book doesn't exist yet
    const categories = await Category.find({ _id: { $in: categoryIds }, bookIds: { $ne: [] } });

    // Create the book
    const book = await Book.create({
      author,
      name,
      price,
      picture: uploadImage.secure_url,
      isDonate,
      isRental,
      stockInInventory,
      categoryId: categoryIds,
      ISBN,
    });

    // Filter out categories where book is already present
    const categoriesToUpdate = categories.filter(category => !category.bookIds.includes(book._id));

    if (categoriesToUpdate.length) {
      await Category.updateMany(
        { _id: { $in: categoriesToUpdate.map(cat => cat._id) } },
        { $push: { bookIds: book._id } }
      );
    }

    res.status(201).json(responseFormatter("Book added successfully", book, true));
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json(responseFormatter("Error adding book", error.message, false));
  }
};
exports.updateBook = async (req, res) => {
  try {
    const { bookId, name, price, isDonate, isRental, stockInInventory, id, author, ISBN } = req.body;
    const file = req.file;

    if (!bookId) return res.status(400).json(responseFormatter("Book ID is required", null, false));

    const existingBook = await Book.findById(bookId);
    if (!existingBook) return res.status(404).json(responseFormatter("Book not found", null, false));

    let updatedFields = { name, price, isDonate, isRental, stockInInventory, author, ISBN };

    // Handle optional image update
    if (file) {
      const uploadImage = await cloud_upload.upload(file.path);
      if (!uploadImage) return res.status(400).json(responseFormatter("Failed to upload book image", null, false));
      updatedFields.picture = uploadImage.secure_url;
    }

    // Convert category IDs to ObjectId array
    const categoryIds = convertToObjectIdArray(id);

    if (categoryIds.length) {
      updatedFields.categoryId = categoryIds;

      // Fetch current categories where the book exists
      const currentCategories = await Category.find({ bookIds: bookId });

      // Remove book from categories where it's no longer assigned
      const categoriesToRemove = currentCategories.filter(cat => !categoryIds.includes(cat._id));
      if (categoriesToRemove.length) {
        await Category.updateMany(
          { _id: { $in: categoriesToRemove.map(cat => cat._id) } },
          { $pull: { bookIds: bookId } }
        );
      }

      // Add book to new categories where it doesn’t exist
      const categoriesToAdd = await Category.find({ _id: { $in: categoryIds }, bookIds: { $ne: bookId } });
      if (categoriesToAdd.length) {
        await Category.updateMany(
          { _id: { $in: categoriesToAdd.map(cat => cat._id) } },
          { $push: { bookIds: bookId } }
        );
      }
    }

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(bookId, updatedFields, { new: true });

    res.status(200).json(responseFormatter("Book updated successfully", updatedBook, true));
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json(responseFormatter("Error updating book", error.message, false));
  }
};

  exports.getAllBooks = async (req, res) => {
    try {
      const books = await Book.find().populate('categoryId');
      res.status(200).json(responseFormatter("Books fetched successfully", books, true));
    } catch (error) {
      res.status(500).json(responseFormatter("Error fetching books", error.message, false));
    }
  };

  exports.deleteAllBooks = async (req, res) => {
    try {
      // Delete all books from the database
      const result = await Book.deleteMany({});
  
      if (result.deletedCount === 0) {
        return res.status(404).json(responseFormatter("No books found to delete", null, false));
      }
  
      res.status(200).json(responseFormatter(`${result.deletedCount} books deleted successfully`, null, true));
    } catch (error) {
      res.status(500).json(responseFormatter("Error deleting books", error.message, false));
    }
  };
  exports.deleteBook = async (req, res) => {
    try {
      const { bookId } = req.params;
  
      if (!bookId) return res.status(400).json(responseFormatter("Book ID is required", null, false));
  
      const book = await Book.findById(bookId);
      if (!book) return res.status(404).json(responseFormatter("Book not found", null, false));
  
      // Remove book from associated categories (using the correct 'bookId' field)
      await Category.updateMany({ bookId }, { $pull: { bookId } });  // Remove book from category
      await  Customer.updateMany({ bookId }, { $pull: { bookId } });
      await  Payment.updateMany({ bookId }, { $pull: { bookId } });
  
      // Delete the book
      await Book.findByIdAndDelete(bookId);
  
      res.status(200).json(responseFormatter("Book deleted successfully", null, true));
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json(responseFormatter("Error deleting book", error.message, false));
    }
  };
  


  exports.rentBook = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id, numberOfDays } = req.body;
  
      if (!id || (Array.isArray(id) && id.length === 0)) {
        return res.status(400).json(responseFormatter("Book ID(s) are required", null, false));
      }
  
      if (!numberOfDays || numberOfDays <= 0) {
        return res.status(400).json(responseFormatter("Valid rental duration is required", null, false));
      }
  
      // Convert book IDs to ObjectId array using reusable function
      const objectIdBookIds = convertToObjectIdArray(id);
  
      if (objectIdBookIds.length === 0) {
        return res.status(400).json(responseFormatter("Invalid Book ID(s)", null, false));
      }
  
      // Fetch books and check rental status
      const books = await Book.aggregate([
        { $match: { _id: { $in: objectIdBookIds } } },
        {
          $project: {
            name: 1,
            price: 1, // Price used for rental charge calculation
            stockInInventory: 1,
            alreadyRented: { $in: [userId, "$customerId"] }
          }
        }
      ]);
  
      if (!books.length) {
        return res.status(404).json(responseFormatter("No valid books found", null, false));
      }
  
      let alreadyRentedBooks = [];
      let rentableBooks = [];
      let totalCharge = 0;
      let rentableBookIds = [];
  
      books.forEach(book => {
        if (book.alreadyRented) {
          alreadyRentedBooks.push(book.name);
        } else if (book.stockInInventory > 0) {
          rentableBooks.push({ bookId: book._id, price: book.price || 0 });
          rentableBookIds.push(book._id);
          totalCharge += (book.price || 0) * numberOfDays;
        }
      });
  
      if (alreadyRentedBooks.length > 0) {
        let message = `You have already rented the following books: ${alreadyRentedBooks.join(", ")}. You cannot rent them again.`;
        if (rentableBooks.length === 0) {
          return res.status(400).json(responseFormatter(message, null, false));
        }
      }
  
      if (rentableBooks.length > 0) {
        // Update books inventory and customer list
        await Book.updateMany(
          { _id: { $in: rentableBookIds } },
          {
            $inc: { stockInInventory: -1 },
            $push: { customerId: userId }
          }
        );
  
        // Update customer applicableCharges
        await Customer.findByIdAndUpdate(userId, { $inc: { applicableCharges: totalCharge }, $push: { bookId: { $each: rentableBookIds } } });

  
        // Create payment record
        const payment = await Payment.create({
          customerId: userId,
          bookId: rentableBookIds,
          numberOfDays,
          totalCharge,
          isPaid: false,
          returned: false
        });
  
        let successMessage = `Successfully rented books: ${rentableBooks.length}`;
        return res.status(200).json(responseFormatter(successMessage, { rented: rentableBookIds, alreadyRented: alreadyRentedBooks, totalCharge, payment }, true));
      }
  
      res.status(400).json(responseFormatter("No books were rented.", null, false));
    } catch (error) {
      res.status(500).json(responseFormatter("Error renting books", error.message, false));
    }
  };
  
  