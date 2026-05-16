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

const upload = multer({ storage: storage });

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
