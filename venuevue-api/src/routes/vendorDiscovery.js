const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const sql = require('mssql');

/**
 * Vendor Discovery Routes
 * Provides endpoints for grouped vendor sections on the main search page
 */

// Helper function to fetch vendor images
async function getVendorImages(vendorProfileId, pool) {
    try {
        const imageRequest = new sql.Request(pool);
        imageRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        
        const imageResult = await imageRequest.query(`
            SELECT TOP 1
                ImageID,
                ImageURL,
                IsPrimary,
                DisplayOrder
            FROM VendorImages 
            WHERE VendorProfileID = @VendorProfileID 
            ORDER BY IsPrimary DESC, DisplayOrder ASC
        `);
        
        if (imageResult.recordset.length > 0) {
            return imageResult.recordset[0].ImageURL;
        }
        return null;
    } catch (error) {
        console.error('Error fetching vendor images:', error);
        return null;
    }
}

// Helper function to get vendor categories
async function getVendorCategories(vendorProfileId, pool) {
    try {
        const categoryRequest = new sql.Request(pool);
        categoryRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        
        const categoryResult = await categoryRequest.query(`
            SELECT Category
            FROM VendorCategories
            WHERE VendorProfileID = @VendorProfileID
        `);
        
        const categories = categoryResult.recordset.map(row => row.Category);
        console.log(`📂 Vendor ${vendorProfileId} categories from DB:`, categories);
        return categories;
    } catch (error) {
        console.error('Error fetching vendor categories:', error);
        return [];
    }
}

// Helper function to check if vendor matches category filter
async function vendorMatchesCategory(vendorProfileId, categoryFilter, pool, vendorData = null) {
    if (!categoryFilter || categoryFilter === 'all') {
        return true;
    }
    
    // First, try to get categories from VendorCategories table
    const categories = await getVendorCategories(vendorProfileId, pool);
    
    // If no categories found in table, check vendor's type field as fallback
    if (categories.length === 0 && vendorData) {
        const vendorType = vendorData.Type || vendorData.type || vendorData.Category || vendorData.category || '';
        if (vendorType) {
            categories.push(vendorType);
        }
    }
    
    // If still no categories, return false (vendor has no category data)
    if (categories.length === 0) {
        console.log(`⚠️ Vendor ${vendorProfileId} (${vendorData?.BusinessName || 'Unknown'}) has NO categories - excluding from filter`);
        return false;
    }
    
    // Map frontend category keys to database category names (multiple variations)
    // These should match what's stored in the VendorCategories table
    const categoryMap = {
        'all': [], // Special case - matches everything
        'venue': ['Venue', 'Venues', 'Event Venue', 'Wedding Venue', 'Event Space'],
        'photo': ['Photography', 'Videography', 'Photo/Video', 'Photographer', 'Videographer', 'Photo & Video'],
        'music': ['Music', 'DJ', 'Music/DJ', 'Musicians', 'Band', 'Live Music', 'Entertainment'],
        'catering': ['Catering', 'Caterer', 'Food', 'Food & Beverage', 'Food Service'],
        'entertainment': ['Entertainment', 'Entertainer', 'Performers', 'Performance'],
        'experiences': ['Experience', 'Experiences', 'Activities', 'Activity'],
        'decor': ['Decor', 'Decoration', 'Decorations', 'Floral', 'Flowers', 'Florist'],
        'beauty': ['Beauty', 'Hair & Makeup', 'Makeup', 'Hair', 'Beauty Services', 'Hair and Makeup'],
        'cake': ['Cake', 'Cakes', 'Bakery', 'Desserts', 'Dessert', 'Pastry'],
        'transport': ['Transportation', 'Transport', 'Vehicles', 'Limo', 'Car Service', 'Vehicle'],
        'planner': ['Planner', 'Planners', 'Event Planning', 'Wedding Planning', 'Event Planner', 'Coordinator'],
        'fashion': ['Fashion', 'Attire', 'Clothing', 'Bridal', 'Formal Wear', 'Dress'],
        'stationery': ['Stationery', 'Invitations', 'Printing', 'Paper Goods', 'Invitation']
    };
    
    const targetCategories = categoryMap[categoryFilter] || [categoryFilter];
    
    // Check if vendor has any service in any of the target categories
    const matches = categories.some(cat => {
        if (!cat) return false;
        const catLower = cat.toLowerCase().trim();
        return targetCategories.some(target => {
            const targetLower = target.toLowerCase().trim();
            // Check for exact match or partial match
            return catLower === targetLower || 
                   catLower.includes(targetLower) || 
                   targetLower.includes(catLower);
        });
    });
    
    if (!matches) {
        console.log(`❌ Vendor ${vendorProfileId} (${vendorData?.BusinessName || 'Unknown'}) filtered out - has [${categories.join(', ')}], need [${targetCategories.join(', ')}]`);
    }
    
    return matches;
}

// Helper function to format vendor data
async function formatVendorData(vendor, pool) {
    // Fetch the primary/featured image
    const featuredImageURL = await getVendorImages(vendor.VendorProfileID, pool);
    
    // Build location string
    const locationParts = [vendor.City, vendor.State].filter(Boolean);
    const location = locationParts.join(', ');
    
    return {
        VendorProfileID: vendor.VendorProfileID,
        vendorProfileId: vendor.VendorProfileID,
        id: vendor.VendorProfileID,
        BusinessName: vendor.BusinessName,
        businessName: vendor.BusinessName,
        name: vendor.BusinessName,
        DisplayName: vendor.DisplayName || vendor.BusinessName,
        displayName: vendor.DisplayName || vendor.BusinessName,
        Tagline: vendor.Tagline,
        tagline: vendor.Tagline,
        City: vendor.City,
        city: vendor.City,
        State: vendor.State,
        state: vendor.State,
        location: location,
        LogoURL: vendor.LogoURL,
        logoUrl: vendor.LogoURL,
        // Featured image for display
        FeaturedImageURL: featuredImageURL || vendor.LogoURL || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png',
        featuredImageURL: featuredImageURL || vendor.LogoURL || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png',
        imageURL: featuredImageURL || vendor.LogoURL || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png',
        image: featuredImageURL || vendor.LogoURL || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png',
        PriceLevel: vendor.PriceLevel,
        priceLevel: vendor.PriceLevel,
        IsPremium: vendor.IsPremium || false,
        isPremium: vendor.IsPremium || false,
        IsFeatured: vendor.IsFeatured || false,
        isFeatured: vendor.IsFeatured || false,
        Latitude: vendor.Latitude,
        latitude: vendor.Latitude,
        Longitude: vendor.Longitude,
        longitude: vendor.Longitude,
        // Use new performance columns
        AverageRating: parseFloat(vendor.AvgRating || vendor.AverageRating || 0),
        averageRating: parseFloat(vendor.AvgRating || vendor.AverageRating || 0),
        rating: parseFloat(vendor.AvgRating || vendor.AverageRating || 0),
        TotalReviews: vendor.TotalReviews || vendor.ReviewCount || 0,
        totalReviews: vendor.TotalReviews || vendor.ReviewCount || 0,
        reviewCount: vendor.TotalReviews || vendor.ReviewCount || 0,
        TotalBookings: vendor.TotalBookings || vendor.BookingCount || 0,
        totalBookings: vendor.TotalBookings || vendor.BookingCount || 0,
        DistanceMiles: vendor.DistanceMiles,
        distanceMiles: vendor.DistanceMiles,
        CreatedAt: vendor.CreatedAt,
        createdAt: vendor.CreatedAt,
        LastReviewDate: vendor.LastReviewDate,
        lastReviewDate: vendor.LastReviewDate,
        // Price fields - use PriceLevel as fallback
        startingPrice: 100, // Default starting price
        MinPrice: 100,
        minPrice: 100,
        price: 100,
        // Category - will need to be fetched separately or use a default
        PrimaryCategory: 'Services',
        primaryCategory: 'Services',
        Category: 'Services',
        category: 'Services',
        // Response time
        ResponseTime: vendor.ResponseTimeHours ? `within ${vendor.ResponseTimeHours} hours` : 'within a few hours',
        responseTime: vendor.ResponseTimeHours ? `within ${vendor.ResponseTimeHours} hours` : 'within a few hours'
    };
}

// Helper function to translate frontend category keys to database category values
function translateCategoryForDatabase(frontendCategory) {
    if (!frontendCategory || frontendCategory === 'all') {
        return null; // No filtering
    }
    
    // Map frontend category keys to the PRIMARY database category names
    // These should match the most common category name in the VendorCategories table
    const categoryMap = {
        'venue': 'Venue',
        'photo': 'Photography', 
        'music': 'Music',
        'catering': 'Catering',
        'entertainment': 'Entertainment',
        'experiences': 'Experience',
        'decor': 'Decor',
        'beauty': 'Beauty',
        'cake': 'Cake',
        'transport': 'Transportation',
        'planner': 'Event Planning',
        'fashion': 'Fashion',
        'stationery': 'Stationery'
    };
    
    const dbCategory = categoryMap[frontendCategory];
    console.log(`🔄 Category translation: '${frontendCategory}' -> '${dbCategory || frontendCategory}'`);
    return dbCategory || frontendCategory;
}

// GET /api/vendor-discovery/sections
// Returns all vendor sections for the main page
router.get('/sections', async (req, res) => {
    try {
        const { city, latitude, longitude, limit = 8, category } = req.query;
        const pool = await poolPromise;
        
        console.log('🔥🔥🔥 DISCOVERY SECTIONS REQUEST 🔥🔥🔥');
        console.log('📦 Fetching discovery sections with filters:', { city, category, latitude, longitude, limit });
        console.log('📦 Full query params:', req.query);
        
        // Translate frontend category to database category
        const dbCategory = translateCategoryForDatabase(category);
        console.log(`🎯 Using database category: '${dbCategory}' for frontend category: '${category}'`);
        
        const sections = [];
        
        // 1. Trending Vendors
        try {
            const trendingRequest = pool.request();
            trendingRequest.input('Limit', sql.Int, parseInt(limit));
            if (city) trendingRequest.input('City', sql.NVarChar(100), city);
            else trendingRequest.input('City', sql.NVarChar(100), null);
            // Pass translated database category to stored procedure for database-level filtering
            if (dbCategory) {
                trendingRequest.input('Category', sql.NVarChar(50), dbCategory);
                console.log(`🔥 Trending: Filtering by category at DB level: ${dbCategory} (from frontend: ${category})`);
            } else {
                trendingRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const trendingResult = await trendingRequest.execute('sp_GetTrendingVendors');
            console.log(`📊 Trending: Got ${trendingResult.recordset.length} vendors from DB`);
            
            if (trendingResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    trendingResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'trending',
                    title: 'Trending Vendors',
                    description: 'Popular vendors getting lots of attention',
                    vendors: vendors
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
            if (dbCategory) {
                topRatedRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                topRatedRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const topRatedResult = await topRatedRequest.execute('sp_GetTopRatedVendors');
            if (topRatedResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    topRatedResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'top-rated',
                    title: 'Top Rated Vendors',
                    description: 'Highest rated by customers',
                    vendors: vendors
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
            if (dbCategory) {
                responsiveRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                responsiveRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const responsiveResult = await responsiveRequest.execute('sp_GetResponsiveVendors');
            if (responsiveResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    responsiveResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'responsive',
                    title: 'Highly Responsive Vendors',
                    description: 'Quick to reply to messages',
                    vendors: vendors
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
            if (dbCategory) {
                recentlyReviewedRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                recentlyReviewedRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const recentlyReviewedResult = await recentlyReviewedRequest.execute('sp_GetRecentlyReviewedVendors');
            console.log(`📝 Recently Reviewed: Got ${recentlyReviewedResult.recordset.length} vendors from DB`);
            
            if (recentlyReviewedResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    recentlyReviewedResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'recently-reviewed',
                    title: 'Recently Reviewed',
                    description: 'Fresh feedback from customers',
                    vendors: vendors
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
                if (dbCategory) {
                    nearbyRequest.input('Category', sql.NVarChar(50), dbCategory);
                } else {
                    nearbyRequest.input('Category', sql.NVarChar(50), null);
                }
                
                const nearbyResult = await nearbyRequest.execute('sp_GetVendorsNearLocation');
                console.log(`📍 Nearby: Got ${nearbyResult.recordset.length} vendors from DB`);
                
                if (nearbyResult.recordset.length > 0) {
                    const vendors = await Promise.all(
                        nearbyResult.recordset.map(v => formatVendorData(v, pool))
                    );
                    sections.push({
                        id: 'nearby',
                        title: 'Vendors Near You',
                        description: 'Closest to your location',
                        vendors: vendors
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
            if (dbCategory) {
                premiumRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                premiumRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const premiumResult = await premiumRequest.execute('sp_GetPremiumVendors');
            console.log(`👑 Premium: Got ${premiumResult.recordset.length} vendors from DB`);
            
            if (premiumResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    premiumResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'premium',
                    title: 'Premium Vendors',
                    description: 'Top-tier verified vendors',
                    vendors: vendors
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
            if (dbCategory) {
                mostBookedRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                mostBookedRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const mostBookedResult = await mostBookedRequest.execute('sp_GetMostBookedVendors');
            console.log(`🔥 Most Booked: Got ${mostBookedResult.recordset.length} vendors from DB`);
            
            if (mostBookedResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    mostBookedResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'most-booked',
                    title: 'Most Booked Vendors',
                    description: 'Customer favorites',
                    vendors: vendors
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
            if (dbCategory) {
                recentlyAddedRequest.input('Category', sql.NVarChar(50), dbCategory);
            } else {
                recentlyAddedRequest.input('Category', sql.NVarChar(50), null);
            }
            
            const recentlyAddedResult = await recentlyAddedRequest.execute('sp_GetRecentlyAddedVendors');
            console.log(`🆕 Recently Added: Got ${recentlyAddedResult.recordset.length} vendors from DB`);
            
            if (recentlyAddedResult.recordset.length > 0) {
                const vendors = await Promise.all(
                    recentlyAddedResult.recordset.map(v => formatVendorData(v, pool))
                );
                sections.push({
                    id: 'recently-added',
                    title: 'Recently Added Vendors',
                    description: 'New vendors to discover',
                    vendors: vendors
                });
            }
        } catch (err) {
            console.error('Error fetching recently added vendors:', err);
        }
        
        // 9. Recommended for You (if user is logged in)
        if (req.query.userId) {
            try {
                const recommendedRequest = pool.request();
                recommendedRequest.input('UserID', sql.Int, parseInt(req.query.userId));
                recommendedRequest.input('Limit', sql.Int, parseInt(limit));
                if (city) recommendedRequest.input('City', sql.NVarChar(100), city);
                else recommendedRequest.input('City', sql.NVarChar(100), null);
                if (dbCategory) {
                    recommendedRequest.input('Category', sql.NVarChar(50), dbCategory);
                } else {
                    recommendedRequest.input('Category', sql.NVarChar(50), null);
                }
                
                const recommendedResult = await recommendedRequest.execute('sp_GetRecommendedVendors');
                console.log(`💡 Recommended: Got ${recommendedResult.recordset.length} vendors from DB`);
                
                if (recommendedResult.recordset.length > 0) {
                    const vendors = await Promise.all(
                        recommendedResult.recordset.map(v => formatVendorData(v, pool))
                    );
                    sections.push({
                        id: 'recommended',
                        title: 'Recommended for You',
                        description: 'Based on your activity and preferences',
                        vendors: vendors
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
        const vendors = await Promise.all(
            result.recordset.map(v => formatVendorData(v, pool))
        );
        
        res.json({
            success: true,
            vendors: vendors,
            count: vendors.length
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
