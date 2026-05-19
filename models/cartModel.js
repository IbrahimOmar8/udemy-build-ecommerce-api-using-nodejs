const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
        price: Number,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    coupon: { type: mongoose.Schema.ObjectId, ref: 'Coupon' },
    totalPrice: { type: Number, default: 0 },
    totalAfterDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
