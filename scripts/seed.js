/**
 * Database seeder.
 *
 * Usage:
 *   node scripts/seed.js              # seed if empty
 *   node scripts/seed.js --reset      # wipe and reseed
 *
 * Creates: 1 admin, 3 instructors, 5 students, 8 categories, ~6 sample courses
 * with sections and lectures, sample reviews, coupons.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const mongoose = require('mongoose');
const slugify = require('slugify');

const dbConnection = require('../config/database');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');
const Review = require('../models/reviewModel');
const Enrollment = require('../models/enrollmentModel');
const Coupon = require('../models/couponModel');

const reset = process.argv.includes('--reset');

const CATEGORIES = [
  { name: 'Web Development', description: 'Frontend & backend web' },
  { name: 'Mobile Development', description: 'iOS, Android, React Native' },
  { name: 'Data Science', description: 'Python, ML, statistics' },
  { name: 'Design', description: 'UI/UX, Figma, design systems' },
  { name: 'Business', description: 'Entrepreneurship, marketing' },
  { name: 'DevOps', description: 'CI/CD, Docker, Kubernetes' },
  { name: 'Cybersecurity', description: 'Ethical hacking, blue team' },
  { name: 'Photography', description: 'Cameras, lighting, editing' },
];

const INSTRUCTORS = [
  {
    name: 'Sara Ahmed',
    email: 'sara@learnhub.dev',
    headline: 'Senior Full-Stack Engineer',
    bio: '10+ years building products with Node, React and TypeScript.',
    expertise: ['JavaScript', 'Node.js', 'React'],
  },
  {
    name: 'Omar Hassan',
    email: 'omar@learnhub.dev',
    headline: 'Mobile Lead at NovaTech',
    bio: 'React Native and iOS engineer, ex-Apple.',
    expertise: ['React Native', 'Swift', 'iOS'],
  },
  {
    name: 'Mona Khalil',
    email: 'mona@learnhub.dev',
    headline: 'Data Scientist & ML Engineer',
    bio: 'PhD in ML, applied AI in fintech and healthcare.',
    expertise: ['Python', 'Machine Learning', 'PyTorch'],
  },
];

const STUDENTS = [
  { name: 'Layla Karim', email: 'layla@learnhub.dev' },
  { name: 'Yousef Adel', email: 'yousef@learnhub.dev' },
  { name: 'Hana Mostafa', email: 'hana@learnhub.dev' },
  { name: 'Ali Rashid', email: 'ali@learnhub.dev' },
  { name: 'Nour Salah', email: 'nour@learnhub.dev' },
];

const COURSES_BLUEPRINT = [
  {
    title: 'Full-Stack JavaScript Bootcamp',
    subtitle: 'Build production-ready apps with Node.js, Express and React',
    description:
      'A comprehensive bootcamp that takes you from zero to deployed full-stack applications. Master Node.js, Express, MongoDB, React, authentication, payments, and deployment.',
    categoryName: 'Web Development',
    instructorEmail: 'sara@learnhub.dev',
    price: 49.99,
    discountPrice: 19.99,
    level: 'beginner',
    tags: ['javascript', 'react', 'node', 'express', 'mongodb'],
    learningOutcomes: [
      'Build RESTful APIs with Express and MongoDB',
      'Create interactive React UIs with hooks and TanStack Query',
      'Implement JWT authentication with refresh tokens',
      'Process payments with Stripe',
      'Deploy a real app to production',
    ],
    requirements: ['Basic JavaScript knowledge', 'A computer with Node.js installed'],
    sections: [
      {
        title: 'Getting started',
        lectures: [
          { title: 'Welcome', duration: 180, isPreview: true },
          { title: 'Installing Node and your editor', duration: 480 },
          { title: 'Project setup', duration: 420 },
        ],
      },
      {
        title: 'Building the API',
        lectures: [
          { title: 'Express fundamentals', duration: 720 },
          { title: 'MongoDB and Mongoose', duration: 900 },
          { title: 'Authentication with JWT', duration: 840 },
          { title: 'Refresh tokens deep-dive', duration: 660 },
        ],
      },
      {
        title: 'Frontend with React',
        lectures: [
          { title: 'React essentials', duration: 780 },
          { title: 'State with Zustand', duration: 540 },
          { title: 'TanStack Query basics', duration: 720 },
        ],
      },
    ],
  },
  {
    title: 'React Native: from idea to App Store',
    subtitle: 'Ship cross-platform apps with Expo and React Native',
    description:
      'Build real mobile apps for iOS and Android using Expo. Learn navigation, native APIs, push notifications, offline mode, and how to publish to the stores.',
    categoryName: 'Mobile Development',
    instructorEmail: 'omar@learnhub.dev',
    price: 79.99,
    discountPrice: 29.99,
    level: 'intermediate',
    tags: ['react-native', 'expo', 'mobile', 'ios', 'android'],
    learningOutcomes: [
      'Build production-quality mobile apps',
      'Use Expo Router for navigation',
      'Implement offline storage and sync',
      'Send push notifications',
      'Publish to App Store and Play Store',
    ],
    requirements: ['JavaScript familiarity', 'Mac (for iOS) or any OS (for Android)'],
    sections: [
      {
        title: 'Foundations',
        lectures: [
          { title: 'Why Expo', duration: 300, isPreview: true },
          { title: 'Project bootstrapping', duration: 540 },
        ],
      },
      {
        title: 'Building screens',
        lectures: [
          { title: 'Layouts and styling', duration: 720 },
          { title: 'Navigation with Expo Router', duration: 600 },
          { title: 'Forms and inputs', duration: 540 },
        ],
      },
    ],
  },
  {
    title: 'Python for Data Science',
    subtitle: 'Pandas, NumPy, visualization, and machine learning basics',
    description:
      'Learn data manipulation, analysis and visualization in Python. We cover pandas, NumPy, matplotlib, seaborn, and the foundations of scikit-learn.',
    categoryName: 'Data Science',
    instructorEmail: 'mona@learnhub.dev',
    price: 0,
    isFree: true,
    level: 'beginner',
    tags: ['python', 'pandas', 'numpy', 'data-science'],
    learningOutcomes: [
      'Work confidently with pandas DataFrames',
      'Build visualizations with matplotlib and seaborn',
      'Train your first machine learning model',
    ],
    requirements: ['Basic Python (variables, functions)'],
    sections: [
      {
        title: 'Pandas basics',
        lectures: [
          { title: 'Series and DataFrames', duration: 600, isPreview: true },
          { title: 'Indexing and filtering', duration: 720 },
        ],
      },
      {
        title: 'Visualization',
        lectures: [
          { title: 'Matplotlib essentials', duration: 660 },
          { title: 'Seaborn deep-dive', duration: 540 },
        ],
      },
    ],
  },
  {
    title: 'Advanced TypeScript Patterns',
    subtitle: 'Master generics, conditional types, and type-level programming',
    description:
      'Take your TypeScript to the next level with advanced patterns used in production codebases. Learn template literal types, mapped types, and complex generics.',
    categoryName: 'Web Development',
    instructorEmail: 'sara@learnhub.dev',
    price: 39.99,
    level: 'advanced',
    tags: ['typescript', 'types', 'advanced'],
    learningOutcomes: [
      'Write reusable generic utilities',
      'Use mapped and conditional types',
      'Build type-safe APIs',
    ],
    requirements: ['Solid TypeScript basics'],
    sections: [
      {
        title: 'Generics in depth',
        lectures: [
          { title: 'Generic constraints', duration: 540, isPreview: true },
          { title: 'Conditional types', duration: 660 },
          { title: 'Inference tricks', duration: 720 },
        ],
      },
    ],
  },
  {
    title: 'Docker & Kubernetes for Developers',
    subtitle: 'Container basics through production K8s deployments',
    description:
      'Hands-on DevOps for app developers. From Docker fundamentals to deploying a multi-service app on Kubernetes with Helm.',
    categoryName: 'DevOps',
    instructorEmail: 'sara@learnhub.dev',
    price: 59.99,
    level: 'intermediate',
    tags: ['docker', 'kubernetes', 'devops', 'helm'],
    learningOutcomes: [
      'Containerize any app with Docker',
      'Run multi-service stacks with docker-compose',
      'Deploy and scale on Kubernetes',
    ],
    requirements: ['Comfort with the command line'],
    sections: [
      {
        title: 'Docker',
        lectures: [
          { title: 'Why containers', duration: 420, isPreview: true },
          { title: 'Writing a Dockerfile', duration: 600 },
          { title: 'docker-compose', duration: 540 },
        ],
      },
      {
        title: 'Kubernetes',
        lectures: [
          { title: 'K8s architecture', duration: 720 },
          { title: 'Deployments and services', duration: 660 },
        ],
      },
    ],
  },
  {
    title: 'UI/UX Design Fundamentals',
    subtitle: 'From wireframes to beautiful, usable interfaces',
    description:
      'Learn design thinking, layout, color, typography, and Figma. Build a complete design system and a portfolio piece.',
    categoryName: 'Design',
    instructorEmail: 'mona@learnhub.dev',
    price: 24.99,
    level: 'all',
    tags: ['design', 'figma', 'ui', 'ux'],
    learningOutcomes: [
      'Understand design principles',
      'Use Figma confidently',
      'Build a portfolio-ready case study',
    ],
    requirements: ['No prior design experience needed'],
    sections: [
      {
        title: 'Design principles',
        lectures: [
          { title: 'Color theory', duration: 480, isPreview: true },
          { title: 'Typography basics', duration: 540 },
        ],
      },
    ],
  },
];

async function main() {
  await dbConnection();
  await new Promise((r) => setTimeout(r, 800));

  if (reset) {
    console.log('Resetting database…');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Section.deleteMany({}),
      Lecture.deleteMany({}),
      Review.deleteMany({}),
      Enrollment.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
  } else {
    const existing = await User.countDocuments();
    if (existing > 0) {
      console.log(`Database already has ${existing} users. Use --reset to wipe.`);
      await mongoose.disconnect();
      return;
    }
  }

  console.log('Seeding admin + users…');
  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@learnhub.dev',
    password: 'admin123456',
    role: 'admin',
    emailVerified: true,
  });

  const instructors = await Promise.all(
    INSTRUCTORS.map((i) =>
      User.create({
        name: i.name,
        email: i.email,
        password: 'password123',
        role: 'instructor',
        emailVerified: true,
        instructorProfile: {
          headline: i.headline,
          bio: i.bio,
          expertise: i.expertise,
          approved: true,
        },
      })
    )
  );

  const students = await Promise.all(
    STUDENTS.map((s) =>
      User.create({
        name: s.name,
        email: s.email,
        password: 'password123',
        role: 'student',
        emailVerified: true,
      })
    )
  );

  console.log('Seeding categories…');
  const categories = await Promise.all(
    CATEGORIES.map((c) =>
      Category.create({
        ...c,
        slug: slugify(c.name, { lower: true, strict: true }),
      })
    )
  );
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c]));
  const instructorByEmail = Object.fromEntries(
    instructors.map((i) => [i.email, i])
  );

  console.log('Seeding courses…');
  for (const blueprint of COURSES_BLUEPRINT) {
    const category = categoryByName[blueprint.categoryName];
    const instructor = instructorByEmail[blueprint.instructorEmail];
    const slug = `${slugify(blueprint.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;

    const course = await Course.create({
      title: blueprint.title,
      subtitle: blueprint.subtitle,
      description: blueprint.description,
      slug,
      instructor: instructor._id,
      category: category._id,
      price: blueprint.price,
      discountPrice: blueprint.discountPrice,
      isFree: blueprint.isFree || blueprint.price === 0,
      level: blueprint.level,
      language: 'en',
      tags: blueprint.tags,
      learningOutcomes: blueprint.learningOutcomes,
      requirements: blueprint.requirements,
      status: 'published',
      publishedAt: new Date(),
    });

    let totalDuration = 0;
    let totalLectures = 0;

    for (let sIdx = 0; sIdx < blueprint.sections.length; sIdx++) {
      const sBp = blueprint.sections[sIdx];
      const section = await Section.create({
        title: sBp.title,
        course: course._id,
        order: sIdx,
      });

      for (let lIdx = 0; lIdx < sBp.lectures.length; lIdx++) {
        const lBp = sBp.lectures[lIdx];
        await Lecture.create({
          title: lBp.title,
          section: section._id,
          course: course._id,
          order: lIdx,
          type: 'video',
          durationSeconds: lBp.duration,
          isPreview: !!lBp.isPreview,
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        });
        totalDuration += lBp.duration;
        totalLectures += 1;
      }
      section.totalLectures = sBp.lectures.length;
      section.totalDurationSeconds = sBp.lectures.reduce(
        (s, l) => s + l.duration,
        0
      );
      await section.save();
    }

    course.totalSections = blueprint.sections.length;
    course.totalLectures = totalLectures;
    course.totalDurationSeconds = totalDuration;
    await course.save();

    // Sample enrollments + reviews
    const reviewers = students.slice(0, 3);
    for (const r of reviewers) {
      await Enrollment.create({
        student: r._id,
        course: course._id,
        pricePaid: course.discountPrice || course.price,
        progressPercent: Math.floor(Math.random() * 80) + 10,
      });
      await Review.create({
        user: r._id,
        course: course._id,
        ratings: Math.floor(Math.random() * 2) + 4,
        title: 'Highly recommended',
        comment: 'Clear explanations and great examples. Learned a lot.',
      });
    }
    course.enrollmentsCount = reviewers.length;
    await course.save();

    console.log(`  • ${blueprint.title}`);
  }

  console.log('Seeding coupons…');
  await Coupon.create([
    {
      code: 'WELCOME20',
      description: '20% off any course',
      discountType: 'percent',
      discountValue: 20,
      expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      appliesTo: 'all',
      createdBy: admin._id,
    },
    {
      code: 'NEWLEARNER',
      description: '$10 off',
      discountType: 'fixed',
      discountValue: 10,
      expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      appliesTo: 'all',
      createdBy: admin._id,
    },
  ]);

  console.log('\n✓ Seed complete\n');
  console.log('Sample credentials (all passwords: password123 unless noted):');
  console.log('  admin    admin@learnhub.dev    (password: admin123456)');
  console.log('  instructor   sara@learnhub.dev');
  console.log('  instructor   omar@learnhub.dev');
  console.log('  instructor   mona@learnhub.dev');
  console.log('  student      layla@learnhub.dev');
  console.log('  student      yousef@learnhub.dev');
  console.log('  ... (3 more students)');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
