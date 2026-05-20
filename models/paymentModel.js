const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        course: { type: mongoose.Schema.ObjectId, ref: 'Course' },
        price: Number,
        title: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    coupon: { type: mongoose.Schema.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ['stripe', 'manual', 'free'],
      default: 'stripe',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    transactionId: String,
    stripeSessionId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    refundedCourses: [{ type: mongoose.Schema.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
