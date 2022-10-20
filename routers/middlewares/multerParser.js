const multer = require('multer');

module.exports = {
    single: (fieldName) => multer({ storage: multer.memoryStorage() }).single(fieldName),
    multiple: multer({
        storage: multer.diskStorage({
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            },
        }),
    }).any(),
};
