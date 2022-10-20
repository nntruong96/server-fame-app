/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
const crypto = require('crypto');

const serverConfig = require('../../config/serverConfig');
const authMiddleware = require('../middlewares/auth');
const User = require('../../db/models/User');
const CustomError = require('../middlewares/customError');
const emailService = require('../../services/email');
const identityError = require('../middlewares/identityError');

const {
  hideSensitiveInfo,
  checkEmail,
  checkPassword,
  filterCreateUserData,
} = require('./utils/userUtils');

const Logger = require('../../Logger');

const logger = Logger.createWithDefaultConfig('routers:controllers:auth');

module.exports = {
  async login(req, res, next) {
    const userId = req.body.email;
    console.log('userId', req.body);
    const { password } = req.body;

    if (!password) {
      throw new CustomError(10021);
    }

    authMiddleware
      .generateJWToken(userId, password, req)
      .then(async ({ userData, accessToken }) => {
        console.log(userData);
        res.cookie(serverConfig.authentication.jwt.cookieId, accessToken);
        res.json({
          data: {
            message: 'Welcome back to Test App, enjoy your time!',
            accessToken,
            userData: hideSensitiveInfo(userData),
          },
        });
      })
      .catch((err) => {
        next(err);
      });
  },
  async logout(req, res) {
    res.clearCookie(serverConfig.authentication.jwt.cookieId);
    res.json({});
  },
  async register(req, res, next) {
    let receivedData = req.body;

    receivedData = filterCreateUserData(receivedData);
    // TODO: Add regex for userId and check other data too.
    delete receivedData._id;

    try {
      if (!receivedData.email) throw new CustomError(10033, 'email');
      checkEmail(receivedData.email, true);
      if (!receivedData.password) throw new CustomError(10021, 'password');
      if (typeof receivedData.password !== 'string')
        receivedData.password = receivedData.password.toString();
      checkPassword(receivedData.password);
      receivedData.siteAdmin = false;
      receivedData.email = receivedData.email.toLowerCase();
      //   [, receivedData.company] = receivedData.email.split('@');

      let newUser;
      let token;
      try {
        //hide verified for dev
        receivedData.isVerified = true;
        if (receivedData.role === 0 || receivedData.role === '0') {
          receivedData.role === 2;
        }
        token = await crypto.randomBytes(20).toString('hex');
        receivedData.verifyToken = token;
        receivedData.verifyTokenExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
        newUser = new User(receivedData);
        await newUser.save();
      } catch (err) {
        console.log('err', err);
        if (err.code === 11000) {
          let userDoc = await User.findOne({
            email: receivedData.email,
          }).exec();
          userDoc = userDoc || {};
          if (userDoc.disabled) {
            try {
              // To remove on elasticsearch
              await User.findOneAndUpdate(
                { _id: userDoc._id },
                { email: `${receivedData.email}@${userDoc._id}` }
              ).exec();
              newUser = new User(receivedData);
              await newUser.save();
              // eslint-disable-next-line no-shadow
            } catch (err) {
              if (err.code === 11000)
                return next(new CustomError(10017, 'email'));
              return next(new CustomError(err.message));
            }
          } else return next(new CustomError(10017, 'email'));
        } else if (err && err.error_code) return next(err);
        else throw identityError(err, undefined, 10034);
      }
      // const verifiedLink = `${req.protocol}://${req.hostname}/api/v1/auth/confirmation/${token}`;
      // emailService
      //   .sendVerifiedEmail(verifiedLink, receivedData.email)
      //   .then(() => logger.debug('send email success'))
      //   .catch((err) => logger.debug('sendVerifiedEmail error', err));
      return res.json({
        data: {
          user: hideSensitiveInfo(newUser),
          message: 'Welcome to Test App, enjoy your time!',
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-ex-assign
      err = identityError(err, undefined, 10034);
      if (err && err.error_code) {
        // eslint-disable-next-line no-ex-assign
        if (err.error_code === 10011) err = new CustomError(10011);
        return next(err);
      }
      next(new CustomError(10034));
    }
  },

  async forgotPassword(req, res, next) {
    if (!req.body.email) return next(new CustomError(10000));
    const receivedData = req.body;
    let userData;
    let token;
    try {
      try {
        userData = await authMiddleware.getUserByEmail(receivedData.email);
        if (!userData || userData.disabled) throw new CustomError(10000);
      } catch (err) {
        logger.debug('Error', err);
        throw new CustomError(10000);
      }
      if (userData.password === undefined) {
        authMiddleware.sendSetPasswordEmail(req, userData);
        throw new CustomError(10038);
      }
      if (
        userData.resetPasswordExpires &&
        Date.now() + 59 * 60 * 1000 < userData.resetPasswordExpires
      )
        // has been call within 1 minite
        throw new CustomError(11003);
      try {
        token = await crypto.randomBytes(20).toString('hex');
        userData.resetPasswordToken = token;
        userData.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
        await userData.save();
      } catch (err) {
        throw new CustomError(err.message);
      }
      const name = userData.firstName || userData.email;
      const setPasswordLink = `${req.protocol}://${req.hostname}/auth/reset?token=${token}&email=${receivedData.email}`;
      emailService
        .sendSetPasswordEmail(name, setPasswordLink, receivedData.email)
        .then(() => logger.debug('send email success'))
        .catch((err) => logger.debug('sendSetPasswordEmail error', err));
      res.json({});
    } catch (err) {
      next(err);
    }
  },
  async resetPassword(req, res, next) {
    if (!req.body.token) return next(new CustomError(10003));

    try {
      if (!req.body.email) return next(new CustomError(10000));

      const userData = await authMiddleware.getUserByEmail(req.body.email);
      if (!userData || userData.disabled) return next(new CustomError(10000));

      if (userData.resetPasswordToken !== req.body.token)
        return next(new CustomError(11004));

      if (userData.resetPasswordExpires < Date.now())
        return next(new CustomError(11005));

      if (!req.body.password || req.body.password.length < 8)
        return next(new CustomError(10031));
      if (req.body.password.length > 128) return next(new CustomError(10032));

      userData.password = req.body.password;
      userData.resetPasswordToken = undefined;
      userData.resetPasswordExpires = undefined;
      await userData.save();
      const name = userData.firstName || userData.email;
      const loginLink = `${req.protocol}://${req.hostname}/auth/login`;
      emailService
        .sendResetPasswordSuccessEmail(name, loginLink, userData.email)
        .then(() => logger.debug('send email success'))
        .catch((err) =>
          logger.debug('sendResetPasswordSuccessEmail error', err)
        );
      res.json({});
    } catch (err) {
      logger.debug('Error', err);
      next(err);
    }
  },
  async verifyForgotPasswordToken(req, res, next) {
    if (!req.body.token) return next(new CustomError(10003));
    if (!req.body.email) return next(new CustomError(10000));
    try {
      const userData = await authMiddleware.getUserByEmail(req.body.email);

      if (!userData || userData.disabled) return next(new CustomError(10000));

      if (userData.resetPasswordToken !== req.body.token)
        throw new CustomError(11004);
      if (userData.resetPasswordExpires < Date.now())
        throw new CustomError(11005);
      return res.json({});
    } catch (err) {
      next(err);
    }
  },
  verifyAccount(req, res, next) {
    if (!req.params.token) return next(new CustomError(10003));
    authMiddleware
      .verifyAccount(req.params.token)
      .then((data) => {
        // emailService
        //   .sendWelcomeEmail(data.email)
        //   .then(() => logger.debug('send email success'))
        //   .catch((err) => logger.debug('sendWelcomeEmail error', err));
        return authMiddleware.getUserByEmail(data.email);
      })
      .then(async (userData) => {
        //create new class room for teacher user
        return authMiddleware.generateJWTokenWithUserData(userData, req);
      })
      .then(({ accessToken }) => {
        res.cookie(serverConfig.authentication.jwt.cookieId, accessToken);
        return res.json({ accessToken });
      })
      .catch((err) => {
        console.log('verifyAccount err', err);
        logger.debug('Error', err);
        if (err) {
          return res.redirect(`/auth/login?verified=false`);
        }
      });
  },
  resend(req, res, next) {
    if (!req.body.email) return next(new CustomError(100003));
    const { protocol } = req;
    const hostName = req.hostname;
    authMiddleware
      .resend(req.body.email, protocol, hostName)
      .then(() => res.json({}))
      .catch(next);
  },
  ensureAuthenticated(req, res, next) {
    if (!req.cookies[serverConfig.authentication.jwt.cookieId])
      return res.sendStatus(401);
    const token = req.cookies[serverConfig.authentication.jwt.cookieId];
    authMiddleware
      .verifyJWToken(token)
      .then((result) => {
        User.findOneAndUpdate(
          { _id: result.content.userId },
          { lastLogin: Math.round(Date.now() / 1000) },
          { new: true, runValidators: true }
        ).exec();
        if (result.renew === true) {
          authMiddleware
            .regenerateJWToken(result.content)
            .then((newToken) => {
              req.userData = {
                token: newToken,
                newToken: true,
                userId: result.content.userId,
                role: result.content.role,
                email: result.content.email,
                siteAdmin: result.content.siteAdmin,
              };
              res.cookie(serverConfig.authentication.jwt.cookieId, newToken);
              // Status code for new token??
              next();
            })
            .catch(next);
        } else {
          req.userData = {
            token,
            userId: result.content.userId,
            role: result.content.role,
            email: result.content.email,
            siteAdmin: result.content.siteAdmin,
          };
          next();
        }
      })
      .catch((err) => {
        res.clearCookie(serverConfig.authentication.jwt.cookieId);
        logger.debug('Cookie verification failed', err);
        res.status(401);
        next(err);
      });
  },
};
