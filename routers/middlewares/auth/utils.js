/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const CustomError = require('../customError');

const isEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};
function initQueryWithId(query, id) {
    const newQuery = query;
    newQuery._id = new RegExp(`^${id}$`, 'i');
    return newQuery;
}

function initQueryWithEmail(query, email) {
    const regexSpKey = ['?', '*', '$', '^', '+'];
    let newEmail = email;
    regexSpKey.forEach((item) => {
        newEmail = email.replace(new RegExp(`\\${item}`, 'g'), `\\${item}`);
    });
    const newQuery = query;
    newQuery.email = new RegExp(`^${newEmail}$`, 'i');
    return newQuery;
}
function randomBytes(value) {
    return new Promise((resolve, reject) => {
        return crypto.randomBytes(value, (err, buf) => {
            if (err) return reject(new CustomError(10012));
            return resolve(buf);
        });
    });
}
module.exports = {
    isEmail,
    initQueryWithId,
    initQueryWithEmail,
    randomBytes,
};
