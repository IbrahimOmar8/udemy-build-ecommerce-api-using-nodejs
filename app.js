const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const mountSwagger = require('./config/swagger');

const mountRoutes = require('./routes');
const { webhookCheckout } = require('./services/paymentService');

const buildApp = () => {
  const app = express();

  app.use(cors());
  app.options('*', cors());
  app.use(compression());

  // Stripe webhook (raw body)
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
    webhookCheckout
  );

  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: true, limit: '20kb' }));

  app.use(express.static(path.join(__dirname, 'uploads')));

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  if (process.env.NODE_ENV !== 'test') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX) || 200,
      message: 'Too many requests from this IP, please try again later',
    });
    app.use('/api', limiter);
  }

  app.use(
    hpp({
      whitelist: [
        'price',
        'discountPrice',
        'ratingsAverage',
        'ratingsQuantity',
        'level',
        'language',
        'category',
        'tags',
      ],
    })
  );

  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  if (process.env.NODE_ENV !== 'test') {
    mountSwagger(app);
  }
  mountRoutes(app);

  app.all('*', (req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
  });

  app.use(globalError);

  return app;
};

module.exports = buildApp;
