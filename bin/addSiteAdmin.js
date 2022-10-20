const crypto = require('crypto');
const serverConfig = require('../config/serverConfig');
const User = require('../db/models/User');

const { sendSetPasswordEmail } = require('../services/email');

const Logger = require('../Logger');

const logger = Logger.createWithDefaultConfig('bin:addSiteAdmin');

const hostname = serverConfig.env.HOST || 'localhost';

module.exports = async () => {
  if (!serverConfig.siteAdminEmails.length) return;
  logger.info('Start add siteAdmin');
  const addSiteAdmins = serverConfig.siteAdminEmails.map(
    ({ email }) =>
      // eslint-disable-next-line no-async-promise-executor, consistent-return
      new Promise(async (resolve, reject) => {
        try {
          let user = await User.findOne({
            email,
          }).exec();
          if (user && user.siteAdmin && user.role === 0) {
            logger.info(`Added ${email}`);
            return resolve(user);
          }

          if (user) {
            user.siteAdmin = true;
            user.role = 0;
            await user.save();
            logger.info(`Added ${email}`);
            return resolve(user);
          }
          const buf = crypto.randomBytes(20);
          const token = buf.toString('hex');
          user = new User({
            email,
            resetPasswordToken: token,
            resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000,
            siteAdmin: true,
            role: 0,
            isVerified: true,
          });
          await user.save();
          const name = user.firstName || user.email;
          const setPasswordLink = `${hostname}/auth/reset?token=${token}&email=${email}`;
          await sendSetPasswordEmail(name, setPasswordLink, email);
          logger.info(`Added ${email}`);
          return resolve(user);
        } catch (err) {
          console.log('err', err);
          reject(err);
        }
      })
  );
  try {
    return await Promise.all(addSiteAdmins);
    logger.info('DONE');
  } catch (err) {
    logger.debug('Error', err);
  }
};
