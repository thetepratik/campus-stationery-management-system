const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for a given user id + role and sets it as an httpOnly cookie.
 * @param {import('express').Response} res
 * @param {string} id - Mongo _id of Admin or Student
 * @param {string} role - 'admin' | 'student'
 */
const generateTokenAndSetCookie = (res, id, role) => {
  const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieName = role === 'admin' ? `${process.env.JWT_COOKIE_NAME}_admin` : `${process.env.JWT_COOKIE_NAME}_student`;

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
};

const clearAuthCookie = (res, role) => {
  const cookieName = role === 'admin' ? `${process.env.JWT_COOKIE_NAME}_admin` : `${process.env.JWT_COOKIE_NAME}_student`;
  res.clearCookie(cookieName, { path: '/' });
};

module.exports = { generateTokenAndSetCookie, clearAuthCookie };
