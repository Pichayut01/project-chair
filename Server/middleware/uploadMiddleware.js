const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createLogger = require('../utils/logger');
const logger = createLogger('Upload');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads', 'profile_photos');
        fs.mkdirSync(uploadPath, { recursive: true });
        logger.debug(`Upload destination: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const filename = req.user._id + '-' + Date.now() + path.extname(file.originalname);
        logger.info(`Uploading file for user ${req.user.email}: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            logger.success(`File validation passed: ${file.originalname} (${file.mimetype})`);
            return cb(null, true);
        }
        logger.error(`File validation failed: ${file.originalname} (${file.mimetype})`);
        cb("Error: File upload only supports the following filetypes - " + filetypes);
    }
}).single('profileImage');

module.exports = upload;
