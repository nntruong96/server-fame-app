const validator = require('validator').default;
const mongoose = require('mongoose');
const CustomError = require('../../middlewares/customError');

const message = (pass, errorFieldName) => ({
    pass,
    errorFieldName,
});

function validateSkill(skillData) {
    const { ranking, level, price } = skillData;
    if (ranking && !validator.isInt(ranking.toString(), { min: 1 })) return message(false, 'ranking');
    if (level && !validator.isInt(level.toString(), { min: 1, max: 5 })) return message(false, 'level');
    if (price && !validator.isNumeric(price.toString(), { min: 0 })) return message(false, 'price');
    return message(true);
}

// check id is exsit in collection
async function isExistInDb(Collection, id) {
    let count = 0;
    if (mongoose.Types.ObjectId.isValid(id)) {
        count = await Collection.count({ _id: id }).exec();
    }
    if (count === 0) throw new CustomError(70003);
    return true;
}

function validateUser(userData) {
    const { gender, birthday } = userData;
    if (gender && !validator.isInt(gender.toString(), { min: 0, max: 2 })) return message(false, 'gender');
    if (birthday && !validator.isInt(birthday.toString())) return message(false, 'birthday');
    return message(true);
}

module.exports = {
    validateSkill,
    validateUser,
    isExistInDb,
};
