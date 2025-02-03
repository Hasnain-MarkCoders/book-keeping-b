// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  bookId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }],
  numberOfDays: { type: Number, required: true },
  totalCharge: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  returned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);