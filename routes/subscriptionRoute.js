const express = require('express');
const authService = require('../services/authService');

const {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  subscribe,
  manualActivate,
  mySubscription,
  cancelSubscription,
  enrollWithSubscription,
} = require('../services/subscriptionService');

const planRouter = express.Router();
planRouter.get('/', listPlans);
planRouter.use(authService.protect, authService.allowedTo('admin'));
planRouter.post('/', createPlan);
planRouter.put('/:id', updatePlan);
planRouter.delete('/:id', deletePlan);

const subscriptionRouter = express.Router();
subscriptionRouter.use(authService.protect);
subscriptionRouter.get('/me', mySubscription);
subscriptionRouter.post('/checkout', authService.allowedTo('student'), subscribe);
subscriptionRouter.post('/activate', manualActivate);
subscriptionRouter.post('/cancel', cancelSubscription);
subscriptionRouter.post(
  '/enroll',
  authService.allowedTo('student'),
  enrollWithSubscription
);

exports.planRouter = planRouter;
exports.subscriptionRouter = subscriptionRouter;
