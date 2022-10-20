const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const mkdirp = require('mkdirp');

const Logger = require('../../../Logger');

const logger = Logger.createWithDefaultConfig('routers:middlewares:fileProcess');

const localDir = path.join(__dirname, '../../../public/images');

const getLocalPathToSave = (userId) => `${localDir}/${userId}`;

async function uploadAvatar(data) {
    return new Promise((resolve, reject) => {
        const pathToSave = getLocalPathToSave(data.userId);
        try {
            if (!fs.existsSync(pathToSave)) mkdirp.sync(pathToSave);
        } catch (err) {
            return reject(err);
        }
        async function saveAvatar() {
            const imageName170 = `${pathToSave}/avatar_170.png`;
            const imageName50 = `${pathToSave}/avatar_50.png`;
            try {
                const infos = await Promise.all([
                    sharp(data.blob).toFormat('png').resize(170, 170).toFile(imageName170),
                    sharp(data.blob).toFormat('png').resize(50, 50).toFile(imageName50),
                ]);
                return resolve(infos);
            } catch (err) {
                logger.debug('Error', err);
                return reject(err);
            }
        }
        return saveAvatar();
    });
}

module.exports = {
    uploadAvatar,
};
