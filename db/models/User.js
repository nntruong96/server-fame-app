const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Logger = require('../../Logger');

const logger = Logger.createWithDefaultConfig('db:models:User');

// Used to generate password hash
const SALT_WORK_FACTOR = 10;
const bcryptSalt = bcrypt.genSaltSync(SALT_WORK_FACTOR);

// Define user model schema
/**
 * @swagger
 *
 * definitions:
 *   NewUser:
 *     type: object
 *     required:
 *       - userId
 *       - password
 *     properties:
 *       userId:
 *         type: string
 *       email:
 *         type: string
 *       password:
 *         type: string
 *         format: password
 *   User:
 *     allOf:
 *       - $ref: '#/definitions/NewUser'
 *       - required:
 *         - id
 *       - properties:
 *          userUnits:
 *              type: array
 *          role:
 *              type: number
 *              enum:
 *              - 0
 *              - 1
 *          siteAdmin:
 *              type: boolean
 *          lastLogin:
 *              type: number
 */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    es_indexed: true,
  },
  password: String,
  role: {
    type: Number, // 0: admin, 1: user
    default: 2,
  },
  firstName: {
    type: String,
    es_indexed: true,
    default: '',
  },
  lastName: {
    type: String,
    es_indexed: true,
    default: '',
  },
  username: {
    type: String,
    es_indexed: true,
    default: '',
  },
  isVerified: Boolean,
  verifyToken: String,
  verifyTokenExpires: Number,
  company: String,
  siteAdmin: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Number,
  },
  disabled: {
    default: false,
    type: Boolean,
    es_indexed: true,
  },
  createdAt: {
    type: Number,
    default: () => Math.round(Date.now() / 1000),
    es_indexed: true,
  },
  lastLogin: Number,

  profilePicture: {
    type: String,
    default: '',
  },
  followers: {
    type: Array,
    default: [],
  },
  followings: {
    type: Array,
    default: [],
  },
  desc: {
    type: String,
    max: 50,
  },
  city: {
    type: String,
    max: 50,
  },
  from: {
    type: String,
    max: 50,
  },
  relationship: {
    type: Number,
    enum: [1, 2, 3],
  },
});

// Middleware executed before save - hash the user's password
// eslint-disable-next-line consistent-return
UserSchema.pre('save', function save(next) {
  const self = this;

  // only hash the password if it has been modified (or is new)
  if (!self.isModified('password')) return next();
  try {
    // hash the password using our new salt
    const hash = bcrypt.hashSync(self.password, bcryptSalt);
    // override the cleartext password with the hashed one
    self.password = hash;
    next();
  } catch (err) {
    return next(err);
  }
});

// Middleware executed before save - hash the user's password
// eslint-disable-next-line consistent-return
UserSchema.pre('updateOne', function updateOne(next) {
  const self = this;

  // only hash the password if it has been modified (or is new)
  const { password } = self.getUpdate() || {};
  if (!password) return next();

  try {
    // hash the password using our new salt
    const hash = bcrypt.hashSync(password, bcryptSalt);
    // override the cleartext password with the hashed one
    self.getUpdate().password = hash;
    next();
  } catch (err) {
    logger.debug('Error', err);
    return next(err);
  }
});

// Middleware executed before save - hash the user's password
// eslint-disable-next-line consistent-return
UserSchema.pre('findOneAndUpdate', function findOneAndUpdate(next) {
  const self = this;

  // only hash the password if it has been modified (or is new)
  const { password } = self.getUpdate() || {};
  if (!password) return next();

  try {
    // hash the password using our new salt
    const hash = bcrypt.hashSync(password, bcryptSalt);
    // override the cleartext password with the hashed one
    self.getUpdate().password = hash;
    next();
  } catch (err) {
    logger.debug('Error', err);
    return next(err);
  }
});

// eslint-disable-next-line consistent-return
UserSchema.pre('findByIdAndUpdate', function findByIdAndUpdate(next) {
  const self = this;

  // only hash the password if it has been modified (or is new)
  if (!self.isModified('password')) return next();
  try {
    // hash the password using our new salt
    const hash = bcrypt.hashSync(self.password, bcryptSalt);
    // override the cleartext password with the hashed one
    self.password = hash;
    next();
  } catch (err) {
    return next(err);
  }
});

// Test candidate password
UserSchema.methods.comparePassword = function comparePassword(
  candidatePassword
) {
  const self = this;
  return bcrypt.compareSync(candidatePassword, self.password);
};

const User = mongoose.model('User', UserSchema);

// Export user model
module.exports = User;
