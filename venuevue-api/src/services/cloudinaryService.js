const cloudinary = require('../config/cloudinary');
const fs = require('fs');

class CloudinaryService {
    /**
     * Upload an image to Cloudinary
     * @param {string} filePath - Local file path or URL
     * @param {object} options - Upload options
     * @returns {Promise<object>} Upload result
     */
    async uploadImage(filePath, options = {}) {
        try {
            const uploadOptions = {
                resource_type: 'auto',
                folder: 'venuevue', // Organize uploads in a folder
                ...options
            };

            const result = await cloudinary.uploader.upload(filePath, uploadOptions);
            
            // Clean up local file if it exists and was uploaded from local storage
            if (fs.existsSync(filePath) && !filePath.startsWith('http')) {
                fs.unlinkSync(filePath);
            }
            
            return result;
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw error;
        }
    }

    /**
     * Upload multiple images to Cloudinary
     * @param {Array<string>} filePaths - Array of file paths or URLs
     * @param {object} options - Upload options
     * @returns {Promise<Array<object>>} Array of upload results
     */
    async uploadMultipleImages(filePaths, options = {}) {
        try {
            const uploadPromises = filePaths.map(filePath => 
                this.uploadImage(filePath, options)
            );
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Multiple upload error:', error);
            throw error;
        }
    }

    /**
     * Get optimized image URL
     * @param {string} publicId - Cloudinary public ID
     * @param {object} transformations - Image transformations
     * @returns {string} Optimized image URL
     */
    getOptimizedUrl(publicId, transformations = {}) {
        const defaultTransformations = {
            fetch_format: 'auto',
            quality: 'auto',
            ...transformations
        };
        
        return cloudinary.url(publicId, defaultTransformations);
    }

    /**
     * Get transformed image URL (e.g., cropped, resized)
     * @param {string} publicId - Cloudinary public ID
     * @param {object} transformations - Image transformations
     * @returns {string} Transformed image URL
     */
    getTransformedUrl(publicId, transformations = {}) {
        return cloudinary.url(publicId, transformations);
    }

    /**
     * Delete an image from Cloudinary
     * @param {string} publicId - Cloudinary public ID
     * @returns {Promise<object>} Deletion result
     */
    async deleteImage(publicId) {
        try {
            return await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw error;
        }
    }

    /**
     * Generate thumbnail URL
     * @param {string} publicId - Cloudinary public ID
     * @param {number} width - Thumbnail width
     * @param {number} height - Thumbnail height
     * @returns {string} Thumbnail URL
     */
    getThumbnailUrl(publicId, width = 150, height = 150) {
        return cloudinary.url(publicId, {
            crop: 'fill',
            gravity: 'auto',
            width: width,
            height: height,
            fetch_format: 'auto',
            quality: 'auto'
        });
    }

    /**
     * Generate auto-cropped square image URL
     * @param {string} publicId - Cloudinary public ID
     * @param {number} size - Square size (width and height)
     * @returns {string} Auto-cropped square image URL
     */
    getSquareUrl(publicId, size = 500) {
        return cloudinary.url(publicId, {
            crop: 'auto',
            gravity: 'auto',
            width: size,
            height: size,
            fetch_format: 'auto',
            quality: 'auto'
        });
    }
}

module.exports = new CloudinaryService();
