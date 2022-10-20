const path = require('path');

const uuid = require('uuid');

const imageExts = new Set(['.jpg', '.png', '.jpeg', '.webp']);

function isImageFilename(filename) {
    const extname = path.extname(filename.toLowerCase());
    return imageExts.has(extname);
}

function createUniqueFilename() {
    const basename = uuid.v4();
    const filename = basename;
    return filename.replace(/ /g, '_');
}

module.exports = {
    isImageFilename,
    createUniqueFilename,
};
