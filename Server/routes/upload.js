const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// Optional File Filter (Currently allowing all files)
const fileFilter = (req, file, cb) => {
    // We allow all files for Stream posts
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: fileFilter
});

// @route   POST /api/upload
// @desc    Upload a file (image, document, etc.)
// @access  Public (or Protected if needed, currently Public for ease)
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Return URL path
    // Assumption: Server serves /uploads statically
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
        msg: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype
    });
});

module.exports = router;
