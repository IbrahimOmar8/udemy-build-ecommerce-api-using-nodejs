const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category required'],
      unique: [true, 'Category must be unique'],
      minlength: [2, 'Too short category name'],
      maxlength: [64, 'Too long category name'],
    },
    slug: { type: String, lowercase: true },
    description: String,
    image: String,
    icon: String,
    parent: { type: mongoose.Schema.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    coursesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  if (doc.image && !doc.image.startsWith('http')) {
    doc.image = `${process.env.BASE_URL}/categories/${doc.image}`;
  }
};

categorySchema.post('init', (doc) => setImageURL(doc));
categorySchema.post('save', (doc) => setImageURL(doc));

module.exports = mongoose.model('Category', categorySchema);
