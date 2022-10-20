/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const User = require('../../db/models/User');
const CustomError = require('../middlewares/customError');
const identityError = require('../middlewares/identityError');
const fileUtils = require('./utils/fileUtils');
const { uploadAvatar } = require('../middlewares/fileProcess');
const Logger = require('../../Logger');
const ObjectId = require('mongodb').ObjectId;
const logger = Logger.createWithDefaultConfig('routers:controllers:user');

const USERS_PAGE_SIZE = 5;

const {
  filterCreateUserData,
  filterUpdateData,
  hideSensitiveInfo,
  checkEmail,
  checkPassword,
} = require('./utils/userUtils');

const { sendSetPasswordEmail } = require('../../services/email');

module.exports = {
  // eslint-disable-next-line consistent-return
  get: async (req, res, next) => {
    const { userData } = req;
    const query = {
      _id: userData.userId,
    };
    try {
      let userDoc = await User.findOne(query).exec();
      userDoc = userDoc || {};
      if (userDoc.disabled) return next(new CustomError(10000));
      res.json({
        data: hideSensitiveInfo(userDoc),
      });
    } catch (err) {
      next(err);
    }
  },
  add: async (req, res) => res.json({}),
  // eslint-disable-next-line consistent-return
  update: async (req, res, next) => {
    const { userId, role } = req.userData;

    const query = {
      _id: userId,
    };

    let userUpdateData = req.body;

    userUpdateData = filterUpdateData(userUpdateData);
    if (userUpdateData.password && !userUpdateData.currentPassword)
      return next(new CustomError(10001));

    try {
      let userData;
      if (userUpdateData.password) {
        userData = await User.findOne(query).exec();
        userData = userData || {};
        if (userData.disabled) return next(new CustomError(10000));
        if (!userData.comparePassword(userUpdateData.currentPassword))
          return next(new CustomError(10023));

        checkPassword(userUpdateData.password);
      } else delete userUpdateData.password;

      userData = await User.findOne(query).exec();

      userData = userData || {};

      if (userData.disabled) return next(new CustomError(10000));

      const avatar = req.file;
      if (avatar) {
        const { originalname } = avatar;
        if (!fileUtils.isImageFilename(originalname))
          throw new CustomError(1000000);
        avatar.blob = avatar.buffer;
        avatar.userId = userId;
        await uploadAvatar(avatar);
      }

      if (role !== 0) {
        delete userUpdateData.company;
      }
      // To update data on elasticsearch
      let chek = await User.findOneAndUpdate(query, userUpdateData, {
        new: true,
        runValidators: true,
      }).exec();
      userData = await User.findOne(query).exec();

      res.json({ data: hideSensitiveInfo(userData) });
    } catch (err) {
      console.log('err', err);
      // eslint-disable-next-line no-ex-assign
      err = identityError(err, undefined, 10034);
      if (err && err.error_code) {
        // eslint-disable-next-line no-ex-assign
        if (err.error_code === 10011) err = new CustomError(10037);
        return next(err);
      }
      next(new CustomError(10034));
    }
  },
  // eslint-disable-next-line consistent-return
  delete: async (req, res, next) => {
    const { userId } = req.userData;

    const query = {
      _id: userId,
    };

    try {
      let userData = await User.findOne(query).exec();
      userData = userData || {};
      if (userData.disabled) return next(new CustomError(10000));
      // To update data on elasticsearch
      await User.findOneAndUpdate(
        query,
        { disabled: true },
        { new: true, runValidators: true }
      ).exec();
      res.json({});
    } catch (err) {
      next(err);
    }
  },
  // eslint-disable-next-line consistent-return
  getUserById: async (req, res, next) => {
    // if (userRole > 0) return next(new CustomError(10035));

    let userId,
      query = {};

    try {
      userId = req.params.id;
    } catch (err) {
      return next(new CustomError(10036));
    }
    console.log('userId', userId);
    if (!ObjectId.isValid(userId)) {
      return next(new CustomError(11008));
    }
    try {
      query = {
        _id: ObjectId(userId),
      };
      let userDoc = await User.findOne(query).exec();
      if (!userDoc || !userDoc._id) {
        return next(new CustomError(11007));
      }
      userDoc = userDoc || {};
      let resData = {};
      if (userDoc.disabled) return next(new CustomError(10018));
      resData = { ...resData, ...hideSensitiveInfo(userDoc) };
      res.json({
        data: resData,
      });
    } catch (err) {
      console.log('err', err);
      next(err);
    }
  },
  // eslint-disable-next-line consistent-return
  updateUserById: async (req, res, next) => {
    const userRole = req.userData.role;
    const { siteAdmin } = req.userData;
    if (userRole > 0) return next(new CustomError(10035));

    let userId;

    try {
      userId = req.params.userId;
    } catch (err) {
      return next(new CustomError(10036));
    }

    let userUpdateData = req.body;

    const query = {
      _id: userId,
    };
    let role;

    // user can update role for other user which have greater role number
    // siteAdmin have full permission
    if (
      siteAdmin ||
      (userRole === 0 &&
        typeof userUpdateData.role === 'number' &&
        userUpdateData.role)
    )
      role = userUpdateData.role;

    userUpdateData = filterUpdateData(userUpdateData);

    if (siteAdmin || (userRole === 0 && typeof role === 'number' && role > 0))
      userUpdateData.role = role;
    delete userUpdateData.password;

    try {
      let userData;

      userData = await User.findOne(query).exec();

      userData = userData || {};

      if (userRole > userData.role && !siteAdmin)
        return next(new CustomError(10035));

      if (
        userRole === userData.role &&
        userId !== req.userData.userId &&
        !siteAdmin
      )
        return next(new CustomError(10035));

      if (userData.disabled) return next(new CustomError(10018));

      if (userRole !== 0) {
        delete userUpdateData.company;
      }

      // To update data on elasticsearch
      await User.findOneAndUpdate(query, userUpdateData, {
        new: true,
        runValidators: true,
      }).exec();

      userData = await User.findOne(query).exec();

      res.json({ data: hideSensitiveInfo(userData) });
    } catch (err) {
      // eslint-disable-next-line no-ex-assign
      err = identityError(err, undefined, 10034);
      if (err && err.error_code) {
        // eslint-disable-next-line no-ex-assign
        if (err.error_code === 10011) err = new CustomError(10037);
        return next(err);
      }
      next(new CustomError(10034));
    }
  },
  // eslint-disable-next-line consistent-return
  deleteUserById: async (req, res, next) => {
    const userRole = req.userData.role;
    const { siteAdmin } = req.userData;
    if (userRole > 0) return next(new CustomError(10035));

    const { userId } = req.params;

    const query = {
      _id: userId,
    };

    try {
      let deletedUserData = await User.findOne(query).exec();
      deletedUserData = deletedUserData || {};
      // user can delete other user which have greater role number
      // siteAdmin have full permission
      if (userRole >= deletedUserData.role && !siteAdmin)
        return next(new CustomError(10035));
      if (deletedUserData.disabled) return next(new CustomError(10018));
      // To update data on elasticsearch
      await User.findOneAndUpdate(
        query,
        { disabled: true },
        { new: true }
      ).exec();
      res.json({});
    } catch (err) {
      next(err);
    }
  },
  // eslint-disable-next-line consistent-return
  createUser: async (req, res, next) => {
    const { userData } = req;
    let receivedData = req.body;
    receivedData.role =
      typeof receivedData.role === 'undefined' ? 1 : receivedData.role;
    // user can add new user which have greater role number
    // siteAdmin have full permission
    if (userData.role >= receivedData.role && !userData.siteAdmin)
      return next(new CustomError(11001));

    try {
      let role;
      if (userData.role === 0) role = receivedData.role;
      receivedData = filterCreateUserData(receivedData);
      if (userData.role === 0) receivedData.role = role;

      checkEmail(receivedData.email, true);
      receivedData.email = receivedData.email.toLowerCase();
      if (!receivedData.company)
        [, receivedData.company] = receivedData.email.split('@');
      let newUser;
      let token;
      receivedData.isVerified = true;
      try {
        const buf = crypto.randomBytes(20);
        token = buf.toString('hex');
        receivedData.resetPasswordToken = token;
        receivedData.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
        // To remove on elasticsearch
        // await User.findOneAndRemove({ email: receivedData.email }); // Delete everytime for testing
        newUser = new User(receivedData);
        await newUser.save();
      } catch (err) {
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
              // eslint-disable-next-line no-ex-assign
              err = identityError(err, undefined, 10034);
              if (err.code === 11000)
                return next(new CustomError(10017, 'email'));
              return next(new CustomError(err.message));
            }
          } else return next(new CustomError(10017, 'email'));
        } else if (err && err.error_code) return next(err);
        else throw identityError(err, undefined, 10034);
      }
      const name = receivedData.firstName || receivedData.email;
      const setPasswordLink = `${req.protocol}://${req.hostname}/auth/reset?token=${token}&email=${receivedData.email}`;
      sendSetPasswordEmail(name, setPasswordLink, receivedData.email)
        .then(() => logger.debug('send email success'))
        .catch((err) => logger.debug('sendVerifiedEmail error', err));
      return res.json({
        data: {
          user: hideSensitiveInfo(newUser),
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
  // eslint-disable-next-line consistent-return
  // getUsers: async (req, res, next) => {
  //   const userRole = req.userData.role;
  //   // if (userRole > 0) return next(new CustomError(10035));

  //   let { page_number, page_size } = req.query;
  //   const { company } = req.query;

  //   page_number = Number(page_number) || 0;
  //   page_number = page_number >= 0 ? page_number : 0;

  //   page_size = Number(page_size) || USERS_PAGE_SIZE;
  //   page_size = page_size >= 0 ? page_size : USERS_PAGE_SIZE;

  //   const query = {
  //     disabled: {
  //       $ne: true,
  //     },
  //   };

  //   if (company) {
  //     query.company = company;
  //   }

  //   try {
  //     const total = await User.find(query).countDocuments();

  //     const list =
  //       (await User.find(query)
  //         .skip(page_number * page_size)
  //         .limit(page_size)
  //         .exec()) || [];

  //     res.json({
  //       data: {
  //         list,
  //         page_info: {
  //           total,
  //           page_number,
  //           page_size,
  //         },
  //       },
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // },
};
