const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true },
    description: String,
    tier: {
      type: String,
      enum: ['personal', 'team', 'business'],
      default: 'personal',
    },
    pricePerMonth: { type: Number, required: true },
    pricePerYear: { type: Number },
    currency: { type: String, default: 'USD' },
    features: [String],
    // Access policy
    catalogAccess: {
      type: String,
      enum: ['all_published', 'curated'],
      default: 'all_published',
    },
    curatedCourses: [{ type: mongoose.Schema.ObjectId, ref: 'Course' }],
    seatsIncluded: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    stripePriceIdMonthly: String,
    stripePriceIdYearly: String,
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plan',
      required: true,
    },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active',
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: Date,
    stripeSubscriptionId: String,
    stripeCustomerId: String,
  },
  { timestamps: true }
);

subscriptionSchema.pre(/^find/, function (next) {
  this.populate({ path: 'plan' });
  next();
});

exports.Plan = mongoose.model('Plan', planSchema);
exports.Subscription = mongoose.model('Subscription', subscriptionSchema);
