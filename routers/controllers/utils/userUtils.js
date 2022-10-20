/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const CustomError = require('../../middlewares/customError');
const User = require('../../../db/models/User');
const Constants = require('../../constants');
// const invalidEmailDomain = require('../../../../client/src/utils/invalidEmailDomain.json');

/**
 * @param {string} email
 * @param {boolean} allowAll
 * @return {string}
 */
function checkEmail(email, allowAll) {
  const re =
    // eslint-disable-next-line no-useless-escape
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (typeof email !== 'string' || email.length === 0)
    throw new CustomError(10033, 'email');
  if (!re.test(email)) {
    console.log('error 1');
    throw new CustomError(10010, 'email');
  }
  const index = email.indexOf('@');
  if (
    email.substr(0, index).length > 64 ||
    email.substr(index + 1, email.length).length > 255
  )
    throw new CustomError(10010, 'email');
  const [, domain] = email.split('@');
  if (!allowAll && Constants.invalidEmail.includes(domain)) {
    console.log('error 2', allowAll);
    throw new CustomError(10010, 'email');
  }
  return '';
}

/**
 * @param {string} error_message
 * @return {string}
 */
function checkPassword(password) {
  const hasWhiteSpace = /\s/;
  if (!password || !password.length || hasWhiteSpace.test(password))
    throw new CustomError(10011, 'password');
  if (password.length < 8) throw new CustomError(10031, 'password');
  if (password.length > 128) throw new CustomError(10032, 'password');
}

function hideSensitiveInfo(userData) {
  const newUserData = JSON.parse(JSON.stringify(userData || {}));
  if (!newUserData.siteAdmin) {
    delete newUserData.siteAdmin;
  }
  delete newUserData.password;
  delete newUserData.verifyToken;
  delete newUserData.verifyTokenExpires;
  delete newUserData.resetPasswordToken;
  delete newUserData.resetPasswordExpires;
  delete newUserData.disabled;
  delete newUserData.createdAt;
  return JSON.parse(JSON.stringify(newUserData || {}));
}

function filterCreateUserData(userData) {
  const newUserData = JSON.parse(JSON.stringify(userData || {}));
  delete newUserData._id;
  // delete newUserData.role;
  delete newUserData.siteAdmin;
  delete newUserData.resetPasswordToken;
  delete newUserData.resetPasswordExpires;
  delete newUserData.disabled;
  delete newUserData.createdAt;
  delete newUserData.isVerified;
  delete newUserData.verifyToken;
  delete newUserData.verifyTokenExpires;

  return JSON.parse(JSON.stringify(newUserData || {}));
}

function filterUpdateData(userData) {
  let newUserData = JSON.parse(JSON.stringify(userData || {}));
  delete newUserData.email;
  delete newUserData.referrerId;
  delete newUserData.registerFrom;

  newUserData = filterCreateUserData(newUserData);

  return JSON.parse(JSON.stringify(newUserData || {}));
}

function getFullName(firstName = '', lastName = '') {
  return `${firstName} ${lastName}`.trim();
}

async function checkUserExist(userId) {
  let count = 0;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    count = await User.countDocuments({
      _id: userId,
      disabled: false,
    }).exec();
  }
  if (count === 0) throw new CustomError(70003);
  return true;
}

module.exports = {
  hideSensitiveInfo,
  checkEmail,
  checkPassword,
  getFullName,
  checkUserExist,
  filterUpdateData,
  filterCreateUserData,
};
