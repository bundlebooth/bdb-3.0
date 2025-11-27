const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

/**
 * Vendor Discovery Routes
 * Provides endpoints for grouped vendor sections on the main search page
 */

// Helper function to format vendor data
function formatVendorData(vendor) {
    return {
        vendorProfileId: vendor.VendorProfileID,
        id: vendor.VendorProfileID,
        businessName: vendor.BusinessName,
        displayName: vendor.DisplayName || vendor.BusinessName,
        tagline: vendor.Tagline,
        city: vendor.City,
        state: vendor.State,
        logoUrl: vendor.LogoURL,
        priceLevel: vendor.PriceLevel,
        isPremium: vendor.IsPremium,
        isFeatured: vendor.IsFeatured,
        latitude: vendor.Latitude,
        longitude: vendor.Longitude,
        // Use new performance columns
        averageRating: parseFloat(vendor.AvgRating || vendor.AverageRating) || 0,
        reviewCount: vendor.TotalReviews || vendor.ReviewCount || 0,
        totalBookings: vendor.TotalBookings || vendor.BookingCount || 0,
        distanceMiles: vendor.DistanceMiles,
        createdAt: vendor.CreatedAt,
        lastReviewDate: vendor.LastReviewDate
    };
}

// GET /api/vendor-discovery/sections
// Returns all vendor sections for the main page
router.get('/sections', async (req, res) => {
    try {
        const { city, latitude, longitude, limit = 8 } = req.query;
        const pool = await poolPromise;
        
        const sections = [];
        
        // 1. Trending Vendors
        try {
            const trendingRequest = pool.request();
            trendingRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) trendingRequest.input('City', sql.NVarChar(100), city);
            else trendingRequest.input('City', sql.NVarChar(100), null);
            
            const trendingResult = await trendingRequest.execute('sp_GetTrendingVendors');
            if (trendingResult.recordset.length > 0) {
                sections.push({
                    id: 'trending',
                    title: 'Trending Vendors',
                    description: 'Popular vendors getting lots of attention',
                    vendors: trendingResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching trending vendors:', err);
        }
        
        // 2. Top Rated Vendors
        try {
            const topRatedRequest = pool.request();
            topRatedRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) topRatedRequest.input('City', sql.NVarChar(100), city);
            else topRatedRequest.input('City', sql.NVarChar(100), null);
            
            const topRatedResult = await topRatedRequest.execute('sp_GetTopRatedVendors');
            if (topRatedResult.recordset.length > 0) {
                sections.push({
                    id: 'top-rated',
                    title: 'Top Rated Vendors',
                    description: 'Highest rated by customers',
                    vendors: topRatedResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching top rated vendors:', err);
        }
        
        // 3. Highly Responsive Vendors
        try {
            const responsiveRequest = pool.request();
            responsiveRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) responsiveRequest.input('City', sql.NVarChar(100), city);
            else responsiveRequest.input('City', sql.NVarChar(100), null);
            
            const responsiveResult = await responsiveRequest.execute('sp_GetResponsiveVendors');
            if (responsiveResult.recordset.length > 0) {
                sections.push({
                    id: 'responsive',
                    title: 'Highly Responsive Vendors',
                    description: 'Quick to reply to messages',
                    vendors: responsiveResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching responsive vendors:', err);
        }
        
        // 4. Recently Reviewed Vendors
        try {
            const recentlyReviewedRequest = pool.request();
            recentlyReviewedRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) recentlyReviewedRequest.input('City', sql.NVarChar(100), city);
            else recentlyReviewedRequest.input('City', sql.NVarChar(100), null);
            recentlyReviewedRequest.input('DaysBack', sql.Int, 14);
            
            const recentlyReviewedResult = await recentlyReviewedRequest.execute('sp_GetRecentlyReviewedVendors');
            if (recentlyReviewedResult.recordset.length > 0) {
                sections.push({
                    id: 'recently-reviewed',
                    title: 'Recently Reviewed',
                    description: 'Fresh feedback from customers',
                    vendors: recentlyReviewedResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching recently reviewed vendors:', err);
        }
        
        // 5. Vendors Near You (if location provided)
        if (latitude && longitude) {
            try {
                const nearbyRequest = pool.request();
                nearbyRequest.input('Latitude', sql.Decimal(10, 8), parseFloat(latitude));
                nearbyRequest.input('Longitude', sql.Decimal(11, 8), parseFloat(longitude));
                nearbyRequest.input('RadiusMiles', sql.Int, 25);
                nearbyRequest.input('Limit', sql.Int, parseInt(limit));
                
                const nearbyResult = await nearbyRequest.execute('sp_GetVendorsNearLocation');
                if (nearbyResult.recordset.length > 0) {
                    sections.push({
                        id: 'nearby',
                        title: 'Vendors Near You',
                        description: 'Closest to your location',
                        vendors: nearbyResult.recordset.map(formatVendorData)
                    });
                }
            } catch (err) {
                console.error('Error fetching nearby vendors:', err);
            }
        }
        
        // 6. Premium Vendors
        try {
            const premiumRequest = pool.request();
            premiumRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) premiumRequest.input('City', sql.NVarChar(100), city);
            else premiumRequest.input('City', sql.NVarChar(100), null);
            
            const premiumResult = await premiumRequest.execute('sp_GetPremiumVendors');
            if (premiumResult.recordset.length > 0) {
                sections.push({
                    id: 'premium',
                    title: 'Premium Vendors',
                    description: 'Top-tier verified vendors',
                    vendors: premiumResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching premium vendors:', err);
        }
        
        // 7. Most Booked Vendors
        try {
            const mostBookedRequest = pool.request();
            mostBookedRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) mostBookedRequest.input('City', sql.NVarChar(100), city);
            else mostBookedRequest.input('City', sql.NVarChar(100), null);
            
            const mostBookedResult = await mostBookedRequest.execute('sp_GetMostBookedVendors');
            if (mostBookedResult.recordset.length > 0) {
                sections.push({
                    id: 'most-booked',
                    title: 'Most Booked Vendors',
                    description: 'Customer favorites',
                    vendors: mostBookedResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching most booked vendors:', err);
        }
        
        // 8. Recently Added Vendors
        try {
            const recentlyAddedRequest = pool.request();
            recentlyAddedRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) recentlyAddedRequest.input('City', sql.NVarChar(100), city);
            else recentlyAddedRequest.input('City', sql.NVarChar(100), null);
            recentlyAddedRequest.input('DaysBack', sql.Int, 30);
            
            const recentlyAddedResult = await recentlyAddedRequest.execute('sp_GetRecentlyAddedVendors');
            if (recentlyAddedResult.recordset.length > 0) {
                sections.push({
                    id: 'recently-added',
                    title: 'Recently Added Vendors',
                    description: 'New vendors to discover',
                    vendors: recentlyAddedResult.recordset.map(formatVendorData)
                });
            }
        } catch (err) {
            console.error('Error fetching recently added vendors:', err);
        }
        
        // 8. Recommended for You (if user is logged in)
        if (req.query.userId) {
            try {
                const recommendedRequest = pool.request();
                recommendedRequest.input('UserID', sql.Int, parseInt(req.query.userId));
                recommendedRequest.input('Limit', sql.Int, parseInt(limit));
                if (city) recommendedRequest.input('City', sql.NVarChar(100), city);
                else recommendedRequest.input('City', sql.NVarChar(100), null);
                
                const recommendedResult = await recommendedRequest.execute('sp_GetRecommendedVendors');
                if (recommendedResult.recordset.length > 0) {
                    sections.push({
                        id: 'recommended',
                        title: 'Recommended for You',
                        description: 'Based on your activity and preferences',
                        vendors: recommendedResult.recordset.map(formatVendorData)
                    });
                }
            } catch (err) {
                console.error('Error fetching recommended vendors:', err);
            }
        }
        
        res.json({
            success: true,
            sections: sections,
            totalSections: sections.length
        });
        
    } catch (error) {
        console.error('Error fetching vendor discovery sections:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor discovery sections',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/trending
router.get('/trending', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetTrendingVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching trending vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/responsive
router.get('/responsive', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetResponsiveVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching responsive vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch responsive vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/top-rated
router.get('/top-rated', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetTopRatedVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching top rated vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top rated vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/most-booked
router.get('/most-booked', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetMostBookedVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching most booked vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch most booked vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/recently-added
router.get('/recently-added', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetRecentlyAddedVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching recently added vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recently added vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/premium
router.get('/premium', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetPremiumVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching premium vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch premium vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/recently-reviewed
router.get('/recently-reviewed', async (req, res) => {
    try {
        const { city, limit = 10 } = req.query;
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetRecentlyReviewedVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching recently reviewed vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recently reviewed vendors',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/nearby
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radiusMiles = 25, limit = 10 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }
        
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('Latitude', sql.Decimal(10, 8), parseFloat(latitude));
        request.input('Longitude', sql.Decimal(11, 8), parseFloat(longitude));
        request.input('RadiusMiles', sql.Int, parseInt(radiusMiles));
        request.input('Limit', sql.Int, parseInt(limit));
        
        const result = await request.execute('sp_GetVendorsNearLocation');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching nearby vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby vendors',
            error: error.message
        });
    }
});

// POST /api/vendor-discovery/track-view
router.post('/track-view', async (req, res) => {
    try {
        const { vendorProfileId, userId, sessionId, ipAddress, userAgent, referrerUrl } = req.body;
        
        if (!vendorProfileId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor profile ID is required'
            });
        }
        
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('VendorProfileID', sql.Int, parseInt(vendorProfileId));
        request.input('UserID', sql.Int, userId || null);
        request.input('SessionID', sql.NVarChar(100), sessionId || null);
        request.input('IPAddress', sql.NVarChar(50), ipAddress || null);
        request.input('UserAgent', sql.NVarChar(500), userAgent || null);
        request.input('ReferrerURL', sql.NVarChar(500), referrerUrl || null);
        
        const result = await request.execute('sp_TrackVendorView');
        
        res.json({
            success: true,
            message: 'View tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking vendor view:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track vendor view',
            error: error.message
        });
    }
});

// POST /api/vendor-discovery/track-response-time
router.post('/track-response-time', async (req, res) => {
    try {
        const { vendorProfileId, conversationId, initialMessageTime, responseTime } = req.body;
        
        if (!vendorProfileId || !conversationId || !initialMessageTime || !responseTime) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const pool = await poolPromise;
        const request = pool.request();
        
        request.input('VendorProfileID', sql.Int, parseInt(vendorProfileId));
        request.input('ConversationID', sql.Int, parseInt(conversationId));
        request.input('InitialMessageTime', sql.DateTime, new Date(initialMessageTime));
        request.input('ResponseTime', sql.DateTime, new Date(responseTime));
        
        const result = await request.execute('sp_TrackMessageResponseTime');
        
        res.json({
            success: true,
            message: 'Response time tracked successfully'
        });
    } catch (error) {
        console.error('Error tracking response time:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track response time',
            error: error.message
        });
    }
});

// GET /api/vendor-discovery/recommended
router.get('/recommended', async (req, res) => {
    try {
        const { userId, city, limit = 10 } = req.query;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required for recommendations'
            });
        }
        
        const pool = await poolPromise;
        
        const request = pool.request();
        request.input('UserID', sql.Int, parseInt(userId));
        request.input('Limit', sql.Int, parseInt(limit));
        if (city) request.input('City', sql.NVarChar(100), city);
        else request.input('City', sql.NVarChar(100), null);
        
        const result = await request.execute('sp_GetRecommendedVendors');
        
        res.json({
            success: true,
            vendors: result.recordset.map(formatVendorData),
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error fetching recommended vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommended vendors',
            error: error.message
        });
    }
});

// Note: View tracking is handled by existing VendorProfileViews table
// Note: Response times are calculated on-the-fly from Messages table
// No additional tracking endpoints needed - using existing infrastructure

module.exports = router;
