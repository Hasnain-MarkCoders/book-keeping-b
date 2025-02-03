// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  picture: { type: String, required: true },
  isDonate: { type: Boolean, default: false },
  isRental: { type: Boolean, default: false },
  customerId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  categoryId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  stockInInventory: { type: Number, required: true },
  ISBN: { type: String, required: true, unique: true }
}, { timestamps: true });
bookSchema.index({ name: 1, author: 1 }, { unique: true });
module.exports = mongoose.model('Book', bookSchema);