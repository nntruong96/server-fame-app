/* eslint-disable no-underscore-dangle */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Q = require('q');

const config = require('../../../config/serverConfig');

const User = require('../../../db/models/User');

const TokenGenerator = require('./localTokenGenerator');

const Logger = require('../../../Logger');

const logger = Logger.createWithDefaultConfig('routers:middlewares:auth');

const tokenGenerator = new TokenGenerator(config, jwt);
const { isEmail, initQueryWithEmail, initQueryWithId } = require('./utils');
const { hideSensitiveInfo } = require('../../controllers/utils/userUtils');

const CustomError = require('../customError');
const emailService = require('../../../services/email');

const sendSetPasswordEmail = async (req, userData) => {
    const newUserData = userData;
    let token;
    try {
        const buf = crypto.randomBytes(20);
        token = buf.toString('hex');
        newUserData.resetPasswordToken = token;
        newUserData.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 60 minutes
        await newUserData.save();
    } catch (err) {
        throw new CustomError(err.message);
    }
    const name = newUserData.firstName || newUserData.email;
    const setPasswordLink = `${req.protocol}://${req.hostname}/auth/reset?token=${token}&email=${userData.email}`;
    emailService
        .sendSetPasswordEmail(name, setPasswordLink, newUserData.email)
        .then(() => logger.debug('send email success'))
        .catch((err) => logger.debug('sendSetPasswordEmail error', err));
};

async function authenticateUser(userId, password, req) {
    let query = {
        disabled: {
            $ne: true,
        },
    };
    query = isEmail(userId) ? initQueryWithEmail(query, userId) : initQueryWithId(query, userId);
    let user;
    const checkUser = () => {
        if (!user) throw new CustomError(70003);
        if (!user.isVerified) throw new CustomError(10002); // Error(CONSTANTS.NOT_VERIFY);
    };
    user = await User.findOne(query).exec();
    checkUser();
    if (!user) throw new CustomError(10000);
    if (user.password === undefined) {
        sendSetPasswordEmail(req, user);
        throw new CustomError(10038);
    }
    // We have a user for that username, test password
    const isMatch = user.comparePassword(password);
    if (isMatch) return user;
    throw new CustomError(10001);
}

async function generateJWTokenWithUserData(userData, req) {
    const accessToken = await tokenGenerator.getToken({
        userId: userData._id,
        email: userData.email,
        role: userData.role,
        type: userData.type,
        siteAdmin: userData.siteAdmin,
        rememberMe: req.body.rememberMe,
    });
    return {
        userData,
        accessToken,
    };
}

async function generateJWToken(userId, password, req) {
    const userData = await authenticateUser(userId, password, req);
    return generateJWTokenWithUserData(userData, req);
}

async function regenerateJWToken(content) {
    const accessToken = await tokenGenerator.getToken({
        userId: content.userId,
        email: content.email,
        role: content.role,
        type: content.type,
        rememberMe: content.rememberMe,
    });
    return accessToken;
}
async function verifyJWToken(token) {
    const content = await jwt.verify(token, config.authentication.jwt.publicKey, {
        algorithms: [config.authentication.jwt.algorithm],
    });
    const result = {
        content,
        renew: false,
    };
    // Check if token is about to expire...
    let { renewBeforeExpires } = config.authentication.jwt.short;
    if (content.rememberMe) {
        renewBeforeExpires = config.authentication.jwt.long.renewBeforeExpires;
    }

    if (renewBeforeExpires > 0 && content.exp - Date.now() / 1000 < renewBeforeExpires) {
        result.renew = true;
    }
    return result;
}
async function getUserByToken(query) {
    try {
        const user = await User.findOne(query).exec();
        if (!user) throw new CustomError(10000);
        return user;
    } catch (err) {
        throw new CustomError(10000);
    }
}
const getUserByEmail = (email) => {
    const query = {
        email: email.toLowerCase(),
    };
    return User.findOne(query);
};

const verifyAccount = (token) => {
    // var query_ = {resetPasswordToken: token, type: {$ne: CONSTANTS.ORGANIZATION}, disabled: {$ne: true}};
    const query = {
        verifyToken: token,
    };
    const update = {
        $set: {
            isVerified: true,
            verifyToken: undefined,
        },
    };
    const deferred = Q.defer();
    User.findOne(query)
        .then((data) => {
            User.updateOne(query, update)
                .then((result) => {
                    if (result.modifiedCount === 0) {
                        return deferred.reject(new Error(`Token invalid or verified.`));
                    }
                    return deferred.resolve({ email: data.email });
                })
                .catch((err) => {
                    logger.debug('Error', err);
                    deferred.reject(new Error(`Token invalid or verified.`));
                });
        })
        .catch((err) => {
            logger.debug('Error', err);
            deferred.reject(new Error(`Token invalid or verified.`));
        });

    return deferred.promise.nodeify();
};

function getUserWithToken(userId) {
    const query_ = {
        $or: [initQueryWithEmail({}, userId)],
        disabled: {
            $ne: true,
        },
    };
    return new Promise((resolve, reject) => {
        User.find(query_).then((userData_) => {
            if (!userData_ || !userData_.length) {
                return reject(new CustomError(10005));
            }
            const userData = userData_[0];
            userData.data = userData.data || {};
            userData.settings = userData.settings || {};

            const { verifyToken } = userData;

            const newData = hideSensitiveInfo(userData);

            newData.verifyToken = verifyToken;

            return resolve(newData);
        });
    });
}

const resend = (email, protocol, hostName) => {
    const deferred = Q.defer();
    getUserWithToken(email)
        .then(async (newData) => {
            const verifiedLink = `${protocol}://${hostName}/api/v1/auth/confirmation/${newData.verifyToken}`;
            await emailService.sendVerifiedEmail(verifiedLink, email);
            deferred.resolve();
        })
        .catch(deferred.reject);
    return deferred.promise.nodeify();
};

module.exports = {
    generateJWToken,
    verifyJWToken,
    getUserByToken,
    getUserByEmail,
    sendSetPasswordEmail,
    regenerateJWToken,
    verifyAccount,
    resend,
    generateJWTokenWithUserData,
};
