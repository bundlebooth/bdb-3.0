const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../services/cloudinaryService');

const router = express.Router();

// Ensure a real temp directory exists (cross-env)
const TEMP_DIR = path.join(__dirname, '../../temp');
try {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
} catch (e) {
    console.warn('Could not ensure TEMP_DIR exists:', e?.message || e);
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, TEMP_DIR); // Temporary directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Upload single image to Cloudinary
 * POST /api/upload/image
 */
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Upload to Cloudinary
        const result = await cloudinaryService.uploadImage(req.file.path, {
            public_id: req.body.public_id || undefined,
            folder: req.body.folder || 'venuevue'
        });

        res.json({
            success: true,
            data: {
                public_id: result.public_id,
                url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type,
                created_at: result.created_at
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload image',
            details: error.message 
        });
    }
});

/**
 * Upload multiple images to Cloudinary
 * POST /api/upload/images
 */
router.post('/images', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        const filePaths = req.files.map(file => file.path);
        const results = await cloudinaryService.uploadMultipleImages(filePaths, {
            folder: req.body.folder || 'venuevue'
        });

        const responseData = results.map(result => ({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at
        }));

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload images',
            details: error.message 
        });
    }
});

/**
 * Get optimized image URL
 * GET /api/upload/optimize/:publicId
 */
router.get('/optimize/:publicId', (req, res) => {
    try {
        const { publicId } = req.params;
        const transformations = req.query;

        const optimizedUrl = cloudinaryService.getOptimizedUrl(publicId, transformations);

        res.json({
            success: true,
            data: {
                public_id: publicId,
                optimized_url: optimizedUrl
            }
        });

    } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({ 
            error: 'Failed to generate optimized URL',
            details: error.message 
        });
    }
});

/**
 * Get transformed image URL
 * GET /api/upload/transform/:publicId
 */
router.get('/transform/:publicId', (req, res) => {
    try {
        const { publicId } = req.params;
        const transformations = req.query;

        const transformedUrl = cloudinaryService.getTransformedUrl(publicId, transformations);

        res.json({
            success: true,
            data: {
                public_id: publicId,
                transformed_url: transformedUrl
            }
        });

    } catch (error) {
        console.error('Transformation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate transformed URL',
            details: error.message 
        });
    }
});

/**
 * Get thumbnail URL
 * GET /api/upload/thumbnail/:publicId
 */
router.get('/thumbnail/:publicId', (req, res) => {
    try {
        const { publicId } = req.params;
        const { width = 150, height = 150 } = req.query;

        const thumbnailUrl = cloudinaryService.getThumbnailUrl(publicId, parseInt(width), parseInt(height));

        res.json({
            success: true,
            data: {
                public_id: publicId,
                thumbnail_url: thumbnailUrl
            }
        });

    } catch (error) {
        console.error('Thumbnail error:', error);
        res.status(500).json({ 
            error: 'Failed to generate thumbnail URL',
            details: error.message 
        });
    }
});

/**
 * Delete image from Cloudinary
 * DELETE /api/upload/:publicId
 */
router.delete('/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        
        const result = await cloudinaryService.deleteImage(publicId);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            error: 'Failed to delete image',
            details: error.message 
        });
    }
});

module.exports = router;
