const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title required'],
      trim: true,
      minlength: [4, 'Too short course title'],
      maxlength: [120, 'Too long course title'],
    },
    slug: { type: String, lowercase: true, unique: true, index: true },
    subtitle: { type: String, maxlength: 200 },
    description: { type: String, required: [true, 'Course description required'] },
    learningOutcomes: [String],
    requirements: [String],
    targetAudience: [String],

    instructor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Course must belong to an instructor'],
      index: true,
    },
    coInstructors: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Course must belong to a category'],
    },
    tags: [String],

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all'],
      default: 'all',
    },
    language: { type: String, default: 'en' },

    thumbnail: String,
    promoVideo: String,

    price: { type: Number, default: 0, min: 0 },
    discountPrice: { type: Number, min: 0 },
    isFree: { type: Boolean, default: false },
    currency: { type: String, default: 'USD' },

    status: {
      type: String,
      enum: ['draft', 'pending_review', 'published', 'archived', 'rejected'],
      default: 'draft',
      index: true,
    },
    publishedAt: Date,

    totalDurationSeconds: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },
    totalSections: { type: Number, default: 0 },
    enrollmentsCount: { type: Number, default: 0 },

    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below or equal 5'],
    },
    ratingsQuantity: { type: Number, default: 0 },

    hasCertificate: { type: Boolean, default: true },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.virtual('sections', {
  ref: 'Section',
  foreignField: 'course',
  localField: '_id',
});

courseSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'course',
  localField: '_id',
});

courseSchema.pre(/^find/, function (next) {
  this.populate({ path: 'instructor', select: 'name profileImg slug instructorProfile.headline' });
  next();
});

const setImageURL = (doc) => {
  if (doc.thumbnail && !doc.thumbnail.startsWith('http')) {
    doc.thumbnail = `${process.env.BASE_URL}/courses/${doc.thumbnail}`;
  }
  if (doc.promoVideo && !doc.promoVideo.startsWith('http')) {
    doc.promoVideo = `${process.env.BASE_URL}/courses/${doc.promoVideo}`;
  }
};

courseSchema.post('init', (doc) => setImageURL(doc));
courseSchema.post('save', (doc) => setImageURL(doc));

module.exports = mongoose.model('Course', courseSchema);
