const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const createAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME || '15m',
  });

const createRefreshToken = (userId) =>
  jwt.sign(
    { userId, jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '30d' }
  );

const verifyRefreshToken = (token) =>
  jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET_KEY || process.env.JWT_SECRET_KEY
  );

module.exports = createAccessToken;
module.exports.createAccessToken = createAccessToken;
module.exports.createRefreshToken = createRefreshToken;
module.exports.verifyRefreshToken = verifyRefreshToken;
