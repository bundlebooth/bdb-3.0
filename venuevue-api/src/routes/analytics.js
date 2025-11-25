const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

// =============================================
// Track Vendor Profile View
// POST /api/analytics/track-view
// Public endpoint - can be called by anyone
// =============================================
router.post('/track-view', async (req, res) => {
    try {
        const { vendorId, referrerUrl, sessionId } = req.body;

        if (!vendorId) {
            return res.status(400).json({ error: 'Vendor ID is required' });
        }

        const pool = await poolPromise;

        // Get viewer info from token if available (optional)
        const viewerUserID = req.user ? req.user.userId : null;

        // Get IP address
        const ipAddress = req.headers['x-forwarded-for'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress ||
                         (req.connection.socket ? req.connection.socket.remoteAddress : null);

        // Get user agent
        const userAgent = req.headers['user-agent'];

        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .input('ViewerUserID', sql.Int, viewerUserID)
            .input('IPAddress', sql.VarChar(45), ipAddress ? ipAddress.split(',')[0].trim() : null)
            .input('UserAgent', sql.VarChar(500), userAgent)
            .input('ReferrerUrl', sql.VarChar(1000), referrerUrl)
            .input('SessionID', sql.VarChar(100), sessionId)
            .execute('sp_TrackVendorProfileView');

        res.json({
            success: true,
            viewId: result.recordset[0].ViewID,
            viewedAt: result.recordset[0].ViewedAt
        });
    } catch (error) {
        console.error('Error tracking profile view:', error);
        res.status(500).json({ 
            error: 'Failed to track profile view',
            details: error.message 
        });
    }
});

// =============================================
// Get Trending Vendors
// GET /api/analytics/trending
// Public endpoint
// =============================================
router.get('/trending', async (req, res) => {
    try {
        const { 
            topN = 5, 
            daysBack = 7, 
            includeImages = true,
            category = null  // *** ADDED: Accept category filter ***
        } = req.query;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('TopN', sql.Int, parseInt(topN))
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .input('IncludeImages', sql.Bit, includeImages === 'true' || includeImages === true)
            .input('Category', sql.NVarChar(50), category)  // *** ADDED: Pass category to stored procedure ***
            .execute('sp_GetTrendingVendors');

        console.log('\n========== TRENDING VENDORS RAW DATA ==========');
        console.log('Total vendors from DB:', result.recordset.length);
        
        const vendors = result.recordset.map((vendor, index) => {
            console.log(`\n--- Vendor ${index + 1}: ${vendor.BusinessName} ---`);
            console.log('Raw ImageURL:', vendor.ImageURL);
            console.log('Raw CloudinaryUrl:', vendor.CloudinaryUrl);
            console.log('Raw LogoURL:', vendor.LogoURL);
            console.log('Raw ImagesJson:', vendor.ImagesJson ? 'EXISTS' : 'NULL');
            
            // Parse JSON fields
            if (vendor.ImagesJson) {
                try {
                    vendor.Images = JSON.parse(vendor.ImagesJson);
                    console.log('Parsed Images array length:', vendor.Images.length);
                    if (vendor.Images.length > 0) {
                        console.log('First image in array:', vendor.Images[0]);
                    }
                } catch (e) {
                    vendor.Images = [];
                    console.log('Error parsing ImagesJson:', e.message);
                }
                delete vendor.ImagesJson;
            }

            // Parse additional categories if it's a string
            if (typeof vendor.AdditionalCategories === 'string') {
                try {
                    vendor.AdditionalCategories = JSON.parse(vendor.AdditionalCategories);
                } catch (e) {
                    vendor.AdditionalCategories = [];
                }
            }

            // FIX: The stored procedure doesn't return ImageURL field, but it DOES return Images array
            // Extract image URL from Images array, CloudinaryUrl, or LogoURL
            let imageUrl = null;
            
            // Try Images array first (this is what's actually being returned)
            if (vendor.Images && vendor.Images.length > 0) {
                const firstImage = vendor.Images[0];
                imageUrl = firstImage.CloudinaryUrl || firstImage.ImageURL;
                console.log('Found image in Images array:', imageUrl);
            }
            
            // Fallback to direct fields
            if (!imageUrl) {
                imageUrl = vendor.CloudinaryUrl || vendor.LogoURL;
                console.log('Using fallback field:', imageUrl);
            }
            
            console.log('✅ FINAL imageUrl chosen:', imageUrl || '❌ NONE FOUND');
            
            // Set multiple fields for maximum frontend compatibility
            vendor.ImageURL = imageUrl;
            vendor.image = imageUrl;
            vendor.PrimaryImageUrl = imageUrl;

            return vendor;
        });
        
        console.log('\n========== END TRENDING VENDORS DATA ==========\n');

        res.json({
            success: true,
            vendors: vendors,
            period: `Last ${daysBack} days`,
            count: vendors.length
        });
    } catch (error) {
        console.error('Error fetching trending vendors:', error);
        res.status(500).json({ 
            error: 'Failed to fetch trending vendors',
            details: error.message 
        });
    }
});

// =============================================
// Get Vendor Analytics (for vendor dashboard)
// GET /api/analytics/vendor/:vendorId
// Protected - requires authentication
// =============================================
router.get('/vendor/:vendorId', authenticate, async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { daysBack = 30 } = req.query;

        const pool = await poolPromise;

        // Verify the vendor belongs to the requesting user (or user is admin)
        const vendorCheck = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

        if (vendorCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorOwnerID = vendorCheck.recordset[0].UserID;
        
        // Check if user owns this vendor profile or is admin
        if (req.user.userId !== vendorOwnerID && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .execute('sp_GetVendorAnalytics');

        // Result has multiple recordsets
        const summary = result.recordsets[0][0]; // Total views, unique viewers
        const dailyViews = result.recordsets[1]; // Daily breakdown
        const hourlyDistribution = result.recordsets[2]; // Hourly distribution
        const topReferrers = result.recordsets[3]; // Top referrers

        res.json({
            success: true,
            period: `Last ${daysBack} days`,
            summary: {
                totalViews: summary.TotalViews,
                uniqueViewers: summary.UniqueViewers,
                daysWithViews: summary.DaysWithViews,
                avgViewsPerDay: summary.DaysWithViews > 0 
                    ? (summary.TotalViews / summary.DaysWithViews).toFixed(1) 
                    : 0
            },
            dailyViews: dailyViews,
            hourlyDistribution: hourlyDistribution,
            topReferrers: topReferrers
        });
    } catch (error) {
        console.error('Error fetching vendor analytics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vendor analytics',
            details: error.message 
        });
    }
});

// =============================================
// Get Vendor View Trends (for comparison)
// GET /api/analytics/vendor/:vendorId/trends
// Protected - requires authentication
// =============================================
router.get('/vendor/:vendorId/trends', authenticate, async (req, res) => {
    try {
        const { vendorId } = req.params;

        const pool = await poolPromise;

        // Verify the vendor belongs to the requesting user (or user is admin)
        const vendorCheck = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .query('SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID');

        if (vendorCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorOwnerID = vendorCheck.recordset[0].UserID;
        
        // Check if user owns this vendor profile or is admin
        if (req.user.userId !== vendorOwnerID && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .execute('sp_GetVendorViewTrends');

        // Result has multiple recordsets - weekly and monthly comparisons
        const weeklyTrends = result.recordsets[0];
        const monthlyTrends = result.recordsets[1];

        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        const weeklyData = {
            current: weeklyTrends[0],
            previous: weeklyTrends[1],
            changePercent: calculateChange(
                weeklyTrends[0].ViewCount,
                weeklyTrends[1].ViewCount
            )
        };

        const monthlyData = {
            current: monthlyTrends[0],
            previous: monthlyTrends[1],
            changePercent: calculateChange(
                monthlyTrends[0].ViewCount,
                monthlyTrends[1].ViewCount
            )
        };

        res.json({
            success: true,
            weekly: weeklyData,
            monthly: monthlyData
        });
    } catch (error) {
        console.error('Error fetching vendor view trends:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vendor view trends',
            details: error.message 
        });
    }
});

// =============================================
// Get Simple View Count (for public display)
// GET /api/analytics/vendor/:vendorId/view-count
// Public endpoint
// =============================================
router.get('/vendor/:vendorId/view-count', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { daysBack = 7 } = req.query;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .query(`
                SELECT COUNT(*) AS ViewCount
                FROM VendorProfileViews
                WHERE VendorProfileID = @VendorProfileID
                  AND ViewedAt >= DATEADD(DAY, -@DaysBack, GETUTCDATE())
            `);

        res.json({
            success: true,
            vendorId: vendorId,
            viewCount: result.recordset[0].ViewCount,
            period: `Last ${daysBack} days`
        });
    } catch (error) {
        console.error('Error fetching view count:', error);
        res.status(500).json({ 
            error: 'Failed to fetch view count',
            details: error.message 
        });
    }
});

module.exports = router;
