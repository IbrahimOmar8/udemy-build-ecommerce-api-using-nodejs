const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      required: [true, 'Coupon code required'],
      unique: true,
      uppercase: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value required'],
      min: 0,
    },
    expireAt: { type: Date, required: true },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    appliesTo: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
    },
    courses: [{ type: mongoose.Schema.ObjectId, ref: 'Course' }],
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
