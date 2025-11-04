const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');

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
            .input('VendorID', sql.Int, vendorId)
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
            includeImages = true 
        } = req.query;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('TopN', sql.Int, parseInt(topN))
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .input('IncludeImages', sql.Bit, includeImages === 'true' || includeImages === true)
            .execute('sp_GetTrendingVendors');

        const vendors = result.recordset.map(vendor => {
            // Parse JSON fields
            if (vendor.ImagesJson) {
                try {
                    vendor.Images = JSON.parse(vendor.ImagesJson);
                } catch (e) {
                    vendor.Images = [];
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

            return vendor;
        });

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
router.get('/vendor/:vendorId', authenticateToken, async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { daysBack = 30 } = req.query;

        const pool = await poolPromise;

        // Verify the vendor belongs to the requesting user (or user is admin)
        const vendorCheck = await pool.request()
            .input('VendorID', sql.Int, vendorId)
            .query('SELECT UserID FROM Vendors WHERE VendorID = @VendorID');

        if (vendorCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorOwnerID = vendorCheck.recordset[0].UserID;
        
        // Check if user owns this vendor profile or is admin
        if (req.user.userId !== vendorOwnerID && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.request()
            .input('VendorID', sql.Int, vendorId)
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
router.get('/vendor/:vendorId/trends', authenticateToken, async (req, res) => {
    try {
        const { vendorId } = req.params;

        const pool = await poolPromise;

        // Verify the vendor belongs to the requesting user (or user is admin)
        const vendorCheck = await pool.request()
            .input('VendorID', sql.Int, vendorId)
            .query('SELECT UserID FROM Vendors WHERE VendorID = @VendorID');

        if (vendorCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorOwnerID = vendorCheck.recordset[0].UserID;
        
        // Check if user owns this vendor profile or is admin
        if (req.user.userId !== vendorOwnerID && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.request()
            .input('VendorID', sql.Int, vendorId)
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
            .input('VendorID', sql.Int, vendorId)
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .query(`
                SELECT COUNT(*) AS ViewCount
                FROM VendorProfileViews
                WHERE VendorID = @VendorID
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
