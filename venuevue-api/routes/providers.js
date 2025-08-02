const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Search providers
router.get('/', async (req, res) => {
  try {
    const {
      searchTerm,
      providerTypeID,
      category,
      location,
      latitude,
      longitude,
      radiusMiles,
      minPrice,
      maxPrice,
      minRating,
      eventDate,
      page = 1,
      pageSize = 10,
      sortBy = 'rating',
      sortDirection = 'DESC'
    } = req.query;

    const query = `
      EXEC sp_Provider_Search
        @SearchTerm = ${searchTerm ? `'${searchTerm}'` : 'NULL'},
        @ProviderTypeID = ${providerTypeID || 'NULL'},
        @Category = ${category ? `'${category}'` : 'NULL'},
        @Location = ${location ? `'${location}'` : 'NULL'},
        @Latitude = ${latitude || 'NULL'},
        @Longitude = ${longitude || 'NULL'},
        @RadiusMiles = ${radiusMiles || 'NULL'},
        @MinPrice = ${minPrice || 'NULL'},
        @MaxPrice = ${maxPrice || 'NULL'},
        @MinRating = ${minRating || 'NULL'},
        @EventDate = ${eventDate ? `'${eventDate}'` : 'NULL'},
        @PageNumber = ${page},
        @PageSize = ${pageSize},
        @SortBy = '${sortBy}',
        @SortDirection = '${sortDirection}'
    `;

    const result = await db.executeQuery(query);
    
    // Transform the result to match your frontend expectations
    const venues = result.rows.map(row => ({
      id: row.ProviderID.value,
      name: row.BusinessName.value,
      description: row.BusinessDescription.value,
      type: row.ProviderType.value,
      category: row.Category.value,
      city: row.City.value,
      state: row.StateProvince.value,
      country: row.Country.value,
      latitude: row.Latitude.value,
      longitude: row.Longitude.value,
      rating: row.AverageRating.value,
      reviewCount: row.ReviewCount.value,
      price: row.BasePrice.value,
      image: row.PrimaryImage.value,
      distance: row.DistanceMiles ? row.DistanceMiles.value : null
    }));

    res.json({
      success: true,
      data: venues,
      totalCount: result.rows[0] ? result.rows[0].TotalCount.value : 0
    });
  } catch (error) {
    console.error('Error searching providers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
