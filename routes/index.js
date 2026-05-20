const authRoute = require('./authRoute');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');

const courseRoute = require('./courseRoute');
const sectionGlobalRoute = require('./sectionGlobalRoute');
const lectureGlobalRoute = require('./lectureGlobalRoute');

const enrollmentMyRoute = require('./myEnrollmentRoute');
const instructorRoute = require('./instructorRoute');

const reviewRoute = require('./reviewRoute');
const qnaGlobalRoute = require('./qnaGlobalRoute');
const noteGlobalRoute = require('./noteGlobalRoute');
const quizGlobalRoute = require('./quizGlobalRoute');
const announcementGlobalRoute = require('./announcementGlobalRoute');
const { bookmarkGlobalRouter } = require('./bookmarkRoute');
const messageRoute = require('./messageRoute');

const cartRoute = require('./cartRoute');
const wishlistRoute = require('./wishlistRoute');
const couponRoute = require('./couponRoute');
const paymentRoute = require('./paymentRoute');

const certificateRoute = require('./certificateRoute');
const notificationRoute = require('./notificationRoute');
const bundleRoute = require('./bundleRoute');
const { planRouter, subscriptionRouter } = require('./subscriptionRoute');

const mountRoutes = (app) => {
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/users', userRoute);
  app.use('/api/v1/categories', categoryRoute);

  app.use('/api/v1/courses', courseRoute);
  app.use('/api/v1/sections', sectionGlobalRoute);
  app.use('/api/v1/lectures', lectureGlobalRoute);

  app.use('/api/v1/enrollments', enrollmentMyRoute);
  app.use('/api/v1/instructors', instructorRoute);

  app.use('/api/v1/reviews', reviewRoute);
  app.use('/api/v1/qna', qnaGlobalRoute);
  app.use('/api/v1/notes', noteGlobalRoute);
  app.use('/api/v1/quizzes', quizGlobalRoute);
  app.use('/api/v1/announcements', announcementGlobalRoute);
  app.use('/api/v1/bookmarks', bookmarkGlobalRouter);
  app.use('/api/v1/messages', messageRoute);

  app.use('/api/v1/cart', cartRoute);
  app.use('/api/v1/wishlist', wishlistRoute);
  app.use('/api/v1/coupons', couponRoute);
  app.use('/api/v1/payments', paymentRoute);

  app.use('/api/v1/certificates', certificateRoute);
  app.use('/api/v1/notifications', notificationRoute);

  app.use('/api/v1/bundles', bundleRoute);
  app.use('/api/v1/plans', planRouter);
  app.use('/api/v1/subscriptions', subscriptionRouter);
};

module.exports = mountRoutes;
