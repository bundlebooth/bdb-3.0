const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
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
            .execute('vendors.sp_TrackProfileView');

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
            city = null
        } = req.query;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('City', sql.NVarChar(100), city)
            .input('Limit', sql.Int, parseInt(topN))
            .execute('vendors.sp_GetTrending');
        
        const vendors = result.recordset.map((vendor, index) => {
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

            // FIX: The stored procedure doesn't return ImageURL field, but it DOES return Images array
            // Extract image URL from Images array, CloudinaryUrl, or LogoURL
            let imageUrl = null;
            
            // Try Images array first (this is what's actually being returned)
            if (vendor.Images && vendor.Images.length > 0) {
                const firstImage = vendor.Images[0];
                imageUrl = firstImage.CloudinaryUrl || firstImage.ImageURL;
            }
            
            // Fallback to direct fields
            if (!imageUrl) {
                imageUrl = vendor.CloudinaryUrl || vendor.LogoURL;
            }
            
            // Set multiple fields for maximum frontend compatibility
            vendor.ImageURL = imageUrl;
            vendor.image = imageUrl;
            vendor.PrimaryImageUrl = imageUrl;

            return vendor;
        });

        res.json({
            success: true,
            vendors: vendors,
            period: 'Last 7 days',
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
            .execute('vendors.sp_GetVendorOwner');

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
            .execute('admin.sp_GetVendorAnalytics');

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
            .execute('vendors.sp_GetVendorOwner');

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
            .execute('admin.sp_GetVendorViewTrends');

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
// Get Vendor Dashboard Analytics (all-in-one)
// GET /api/analytics/vendor/:vendorId/dashboard
// Protected - requires authentication
// =============================================
router.get('/vendor/:vendorId/dashboard', authenticate, async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { daysBack = 180 } = req.query;
        console.log(`[Analytics Dashboard] vendorId=${vendorId}, daysBack=${daysBack}`);

        const pool = await poolPromise;

        // Verify the vendor belongs to the requesting user (or user is admin)
        const vendorCheck = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .execute('vendors.sp_GetVendorOwner');

        if (vendorCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendorOwnerID = vendorCheck.recordset[0].UserID;
        
        if (req.user.userId !== vendorOwnerID && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Call the stored procedure
        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .input('DaysBack', sql.Int, parseInt(daysBack))
            .execute('analytics.sp_GetVendorDashboardAnalytics');

        // Parse the 4 result sets
        const monthlyData = result.recordsets[0] || [];
        const summary = result.recordsets[1]?.[0] || { TotalViews: 0, TotalBookings: 0, TotalRevenue: 0 };
        const statusBreakdown = result.recordsets[2]?.[0] || { PendingCount: 0, ConfirmedCount: 0, CompletedCount: 0, CancelledCount: 0 };
        const additionalMetrics = result.recordsets[3]?.[0] || { FavoriteCount: 0, ReviewCount: 0, AvgRating: 5.0, AvgResponseTime: 0 };

        // For 7d/30d views, generate daily data points in JavaScript
        let dailyData = [];
        const days = parseInt(daysBack);
        if (days <= 30) {
            try {
                // Query actual views and bookings per day
                const dailyResult = await pool.request()
                    .input('VendorProfileID', sql.Int, vendorId)
                    .input('DaysBack', sql.Int, days)
                    .query(`
                        SELECT 
                            CAST(ViewedAt AS DATE) AS ViewDate, 
                            COUNT(*) AS ViewCount
                        FROM vendors.VendorProfileViews
                        WHERE VendorProfileID = @VendorProfileID
                        AND ViewedAt >= DATEADD(DAY, -@DaysBack, GETDATE())
                        GROUP BY CAST(ViewedAt AS DATE)
                    `);
                
                const bookingsResult = await pool.request()
                    .input('VendorProfileID', sql.Int, vendorId)
                    .input('DaysBack', sql.Int, days)
                    .query(`
                        SELECT 
                            CAST(CreatedAt AS DATE) AS BookingDate, 
                            COUNT(*) AS BookingCount, 
                            SUM(ISNULL(TotalAmount, 0)) AS Revenue
                        FROM bookings.Bookings
                        WHERE VendorProfileID = @VendorProfileID
                        AND CreatedAt >= DATEADD(DAY, -@DaysBack, GETDATE())
                        GROUP BY CAST(CreatedAt AS DATE)
                    `);
                
                // Create a map of views and bookings by date
                const viewsMap = {};
                const bookingsMap = {};
                
                dailyResult.recordset.forEach(r => {
                    const dateStr = new Date(r.ViewDate).toISOString().split('T')[0];
                    viewsMap[dateStr] = r.ViewCount;
                });
                
                bookingsResult.recordset.forEach(r => {
                    const dateStr = new Date(r.BookingDate).toISOString().split('T')[0];
                    bookingsMap[dateStr] = { count: r.BookingCount, revenue: r.Revenue };
                });
                
                // Generate array of dates for the period
                const today = new Date();
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    dailyData.push({
                        dateValue: date,
                        dayLabel: dayLabel,
                        dateKey: dateStr,
                        views: viewsMap[dateStr] || 0,
                        bookings: bookingsMap[dateStr]?.count || 0,
                        revenue: bookingsMap[dateStr]?.revenue || 0
                    });
                }
                
                console.log(`Daily data generated for ${days} days:`, dailyData.length, 'records');
            } catch (dailyErr) {
                console.error('Error fetching daily data:', dailyErr.message);
                // Continue without daily data - will fall back to monthly
            }
        }

        console.log(`[Analytics Dashboard] Returning response: dailyData.length=${dailyData.length}, monthlyData.length=${monthlyData.length}`);
        res.json({
            success: true,
            dailyData: dailyData,
            monthlyData: monthlyData.map(m => ({
                monthLabel: m.MonthLabel,
                monthKey: m.MonthKey,
                views: m.ViewCount,
                bookings: m.BookingCount,
                revenue: m.Revenue
            })),
            summary: {
                totalViews: summary.TotalViews,
                totalBookings: summary.TotalBookings,
                totalRevenue: summary.TotalRevenue,
                conversionRate: summary.TotalViews > 0 
                    ? ((summary.TotalBookings / summary.TotalViews) * 100).toFixed(1) 
                    : 0
            },
            bookingsByStatus: {
                pending: statusBreakdown.PendingCount,
                confirmed: statusBreakdown.ConfirmedCount,
                completed: statusBreakdown.CompletedCount,
                cancelled: statusBreakdown.CancelledCount
            },
            additionalMetrics: {
                favoriteCount: additionalMetrics.FavoriteCount,
                reviewCount: additionalMetrics.ReviewCount,
                avgRating: additionalMetrics.AvgRating,
                avgResponseTime: additionalMetrics.AvgResponseTime || 0
            }
        });
    } catch (error) {
        console.error('Error fetching vendor dashboard analytics:', error);
        res.status(500).json({ 
            error: 'Failed to fetch vendor dashboard analytics',
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
            .execute('admin.sp_Analytics_GetVendorViewCount');

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
