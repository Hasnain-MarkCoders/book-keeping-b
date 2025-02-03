const Category = require('../models/Category');
const { responseFormatter } = require('../utils/responseFormatter');
const { cloud_upload } = require('../utils/cloudinaryConfig');
const { default: mongoose } = require('mongoose');
const { convertToObjectIdArray } = require('../utils/helper');
const Book = require('../models/book');
exports.addCategory = async (req, res) => {
  try {
    const { name, id } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json(responseFormatter("Image is required", null, false));
    const uploadImage = await cloud_upload?.upload(file.path)
    if (!uploadImage) return res.status(400).json(responseFormatter("Failed to  upload category image", null, false));
    const bookIds = convertToObjectIdArray(id)

    const category = await Category.create({
      name,
      bookId: bookIds,
      picture: uploadImage.secure_url,
    });
    res.status(201).json(responseFormatter("Category added successfully", category, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error category book", error.message, false));
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, id, bookIds } = req.body;
    const file = req.file;

    // Validate ID and Find Category
    if (!id) return res.status(400).json(responseFormatter("Category ID is required", null, false));

    const category = await Category.findById(id);
    if (!category) return res.status(404).json(responseFormatter("Category not found", null, false));

    let imageUrl = category.picture;

    // Upload Image if Provided
    if (file) {
      const uploadImage = await cloud_upload.upload(file.path);
      if (!uploadImage) {
        return res.status(400).json(responseFormatter("Failed to upload category image", null, false));
      }
      imageUrl = uploadImage.secure_url;
    }

    // Update category fields
    category.name = name || category.name;
    category.picture = imageUrl;
    if (bookIds) category.bookId = convertToObjectIdArray(bookIds);

    await category.save();
    res.status(200).json(responseFormatter("Category updated successfully", category, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error updating category", error.message, false));
  }
};
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("bookId")
    res.status(200).json(responseFormatter("Categories fetched successfully", categories, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error fetching categories", error.message, false));
  }
};

exports.getACategory = async (req, res) => {
  try {
    const { categoryId } = req.body
    const category = await Book.findOne({ _id: categoryId }).populate('bookId');
    res.status(200).json(responseFormatter("Category fetched successfully", category, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error fetching category", error.message, false));
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) return res.status(400).json(responseFormatter("Category ID is required", null, false));

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json(responseFormatter("Category not found", null, false));

    // Remove book from associated categories (using the correct 'bookId' field)
    await Book.updateMany({ categoryId }, { $pull: { categoryId } });  // Remove book from category
    // Delete the book
    await Category.findByIdAndDelete(categoryId);
    res.status(200).json(responseFormatter("Category deleted successfully", null, true));
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json(responseFormatter("Error deleting category", error.message, false));
  }
};

exports.deleteAllCategories = async (req, res) => {
  try {
    // Delete all books from the database
    const result = await Category.deleteMany({});

    if (result.deletedCount === 0) {
      return res.status(404).json(responseFormatter("No categories found to delete", null, false));
    }

    res.status(200).json(responseFormatter(`${result.deletedCount} categories deleted successfully`, null, true));
  } catch (error) {
    res.status(500).json(responseFormatter("Error deleting books", error.message, false));
  }
};