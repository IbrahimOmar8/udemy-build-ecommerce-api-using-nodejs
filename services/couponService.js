const factory = require('./handlersFactory');
const Coupon = require('../models/couponModel');

exports.setCreator = (req, res, next) => {
  if (!req.body.createdBy) req.body.createdBy = req.user._id;
  next();
};

exports.getCoupons = factory.getAll(Coupon);
exports.getCoupon = factory.getOne(Coupon);
exports.createCoupon = factory.createOne(Coupon);
exports.updateCoupon = factory.updateOne(Coupon);
exports.deleteCoupon = factory.deleteOne(Coupon);
