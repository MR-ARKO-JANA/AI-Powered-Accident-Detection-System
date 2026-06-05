const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/accidents/');
    },
    filename: function (req, file, cb) {
        cb(null, 'accident-' + Date.now() + path.extname(file.originalname));
    }
});

// File type validation — only allow image uploads
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// @route   POST /api/upload
// @desc    Upload an accident frame
// @access  Public (for AI Service)
router.post('/', upload.single('frame'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Construct the public URL for the image
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/accidents/${req.file.filename}`;
    
    res.status(200).json({ url: imageUrl });
});

module.exports = router;
