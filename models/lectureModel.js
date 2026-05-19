const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lecture title required'],
      trim: true,
      maxlength: 200,
    },
    description: String,
    section: {
      type: mongoose.Schema.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    order: { type: Number, default: 0, index: true },

    type: {
      type: String,
      enum: ['video', 'article', 'quiz', 'assignment'],
      required: true,
      default: 'video',
    },

    // Video specific
    videoUrl: String,
    videoFilename: String,
    durationSeconds: { type: Number, default: 0 },
    captions: [
      {
        language: String,
        url: String,
      },
    ],

    // Article specific (HTML content)
    article: String,

    // Quiz/Assignment references
    quiz: { type: mongoose.Schema.ObjectId, ref: 'Quiz' },
    assignment: { type: mongoose.Schema.ObjectId, ref: 'Assignment' },

    attachments: [
      {
        name: String,
        filename: String,
        url: String,
        size: Number,
        mimeType: String,
      },
    ],

    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const setVideoURL = (doc) => {
  if (doc.videoFilename && !doc.videoUrl) {
    doc.videoUrl = `${process.env.BASE_URL}/lectures/videos/${doc.videoFilename}`;
  }
  if (doc.attachments && doc.attachments.length) {
    doc.attachments = doc.attachments.map((a) => {
      if (a.filename && !a.url) {
        a.url = `${process.env.BASE_URL}/lectures/attachments/${a.filename}`;
      }
      return a;
    });
  }
};

lectureSchema.post('init', (doc) => setVideoURL(doc));
lectureSchema.post('save', (doc) => setVideoURL(doc));

module.exports = mongoose.model('Lecture', lectureSchema);
