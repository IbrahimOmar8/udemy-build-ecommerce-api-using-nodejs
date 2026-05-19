const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    phone: String,
    profileImg: String,
    coverImg: String,

    password: {
      type: String,
      required: [true, 'password required'],
      minlength: [6, 'Too short password'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,

    emailVerified: { type: Boolean, default: false },
    emailVerifyCode: String,
    emailVerifyExpires: Date,

    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    active: {
      type: Boolean,
      default: true,
    },

    // Instructor-specific profile
    instructorProfile: {
      headline: String,
      bio: String,
      expertise: [String],
      website: String,
      socials: {
        twitter: String,
        linkedin: String,
        youtube: String,
        github: String,
      },
      ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
      ratingsQuantity: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      totalCourses: { type: Number, default: 0 },
      payoutEmail: String,
      approved: { type: Boolean, default: false },
    },

    // Student-specific
    wishlist: [{ type: mongoose.Schema.ObjectId, ref: 'Course' }],
    enrolledCount: { type: Number, default: 0 },

    // Preferences
    preferredLanguage: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },

    // Auth (refresh tokens, basic device tracking)
    refreshTokens: [
      {
        token: String,
        userAgent: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  if (doc.profileImg && !doc.profileImg.startsWith('http')) {
    doc.profileImg = `${process.env.BASE_URL}/users/${doc.profileImg}`;
  }
  if (doc.coverImg && !doc.coverImg.startsWith('http')) {
    doc.coverImg = `${process.env.BASE_URL}/users/${doc.coverImg}`;
  }
};

userSchema.post('init', (doc) => setImageURL(doc));
userSchema.post('save', (doc) => setImageURL(doc));

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
