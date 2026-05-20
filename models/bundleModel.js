const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, lowercase: true, unique: true, index: true },
    description: String,
    thumbnail: String,
    courses: [{ type: mongoose.Schema.ObjectId, ref: 'Course' }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const setThumbnailURL = (doc) => {
  if (doc.thumbnail && !doc.thumbnail.startsWith('http')) {
    doc.thumbnail = `${process.env.BASE_URL}/courses/${doc.thumbnail}`;
  }
};
bundleSchema.post('init', (doc) => setThumbnailURL(doc));
bundleSchema.post('save', (doc) => setThumbnailURL(doc));

module.exports = mongoose.model('Bundle', bundleSchema);
