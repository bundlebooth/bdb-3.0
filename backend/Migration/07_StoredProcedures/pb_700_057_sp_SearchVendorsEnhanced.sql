/*
    Migration Script: Create Enhanced Stored Procedure [vendors].[sp_SearchEnhanced]
    Description: Enhanced vendor search with all new filter parameters
    
    New Filters Added:
    - Instant Booking
    - Fresh Listings (new vendors)
    - Google Reviews
    - Price Range (min/max slider)
    - Review Count
    - Availability (date/day of week)
    - Category Questions (filterable)
    - Vendor Features
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SearchEnhanced]'))
    DROP PROCEDURE [vendors].[sp_SearchEnhanced];
GO

CREATE PROCEDURE [vendors].[sp_SearchEnhanced]
    -- Basic search parameters
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
    @City NVARCHAR(100) = NULL,
    @Region NVARCHAR(50) = NULL,
    
    -- Price range (slider)
    @MinPrice DECIMAL(10, 2) = NULL,
    @MaxPrice DECIMAL(10, 2) = NULL,
    
    -- Rating filters
    @MinRating DECIMAL(2, 1) = NULL,
    @MinReviewCount INT = NULL,
    
    -- Boolean profile filters
    @IsPremium BIT = NULL,
    @IsEcoFriendly BIT = NULL,
    @IsAwardWinning BIT = NULL,
    @IsLastMinute BIT = NULL,
    @IsCertified BIT = NULL,
    @IsInsured BIT = NULL,
    @IsLocal BIT = NULL,
    @IsMobile BIT = NULL,
    
    -- NEW: Instant Booking filter
    @InstantBookingOnly BIT = NULL,
    
    -- NEW: Fresh Listings (vendors created within X days)
    @FreshListingsDays INT = NULL,
    
    -- NEW: Has Google Reviews
    @HasGoogleReviews BIT = NULL,
    
    -- NEW: Has Availability on specific date
    @AvailabilityDate DATE = NULL,
    @AvailabilityDayOfWeek TINYINT = NULL, -- 0=Sunday, 1=Monday, etc.
    
    -- Location-based search
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 25,
    
    -- Event Types and Cultures (comma-separated IDs)
    @EventTypeIDs NVARCHAR(500) = NULL,
    @CultureIDs NVARCHAR(500) = NULL,
    
    -- NEW: Category Question Filters (JSON format: [{"questionId": 1, "answer": "Yes"}, ...])
    @QuestionFilters NVARCHAR(MAX) = NULL,
    
    -- NEW: Feature Filters (comma-separated feature IDs)
    @FeatureIDs NVARCHAR(500) = NULL,
    
    -- Experience and Service Location
    @ExperienceRange NVARCHAR(20) = NULL,
    @ServiceLocation NVARCHAR(50) = NULL,
    
    -- Pagination and sorting
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'recommended'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 200 SET @PageSize = 200;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Parse comma-separated IDs into temp tables
    CREATE TABLE #EventTypeFilter (EventTypeID INT);
    CREATE TABLE #CultureFilter (CultureID INT);
    CREATE TABLE #FeatureFilter (FeatureID INT);
    
    IF @EventTypeIDs IS NOT NULL AND @EventTypeIDs != ''
    BEGIN
        INSERT INTO #EventTypeFilter (EventTypeID)
        SELECT CAST(value AS INT) FROM STRING_SPLIT(@EventTypeIDs, ',') WHERE RTRIM(LTRIM(value)) != '';
    END
    
    IF @CultureIDs IS NOT NULL AND @CultureIDs != ''
    BEGIN
        INSERT INTO #CultureFilter (CultureID)
        SELECT CAST(value AS INT) FROM STRING_SPLIT(@CultureIDs, ',') WHERE RTRIM(LTRIM(value)) != '';
    END
    
    IF @FeatureIDs IS NOT NULL AND @FeatureIDs != ''
    BEGIN
        INSERT INTO #FeatureFilter (FeatureID)
        SELECT CAST(value AS INT) FROM STRING_SPLIT(@FeatureIDs, ',') WHERE RTRIM(LTRIM(value)) != '';
    END
    
    -- Parse question filters from JSON
    CREATE TABLE #QuestionFilter (QuestionID INT, ExpectedAnswer NVARCHAR(500));
    
    IF @QuestionFilters IS NOT NULL AND @QuestionFilters != '' AND ISJSON(@QuestionFilters) = 1
    BEGIN
        INSERT INTO #QuestionFilter (QuestionID, ExpectedAnswer)
        SELECT 
            JSON_VALUE(value, '$.questionId'),
            JSON_VALUE(value, '$.answer')
        FROM OPENJSON(@QuestionFilters);
    END
    
    -- Pre-compute aggregates into temp table for performance
    CREATE TABLE #VendorStats (
        VendorProfileID INT PRIMARY KEY,
        AverageRating DECIMAL(3,1),
        ReviewCount INT,
        FavoriteCount INT,
        BookingCount INT,
        ProfileViews INT
    );
    
    INSERT INTO #VendorStats (VendorProfileID, AverageRating, ReviewCount, FavoriteCount, BookingCount, ProfileViews)
    SELECT 
        v.VendorProfileID,
        ISNULL(v.AvgRating, 0),
        ISNULL(v.TotalReviews, 0),
        (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID),
        ISNULL(v.TotalBookings, 0),
        (SELECT COUNT(*) FROM vendors.VendorProfileViews pv WHERE pv.VendorProfileID = v.VendorProfileID)
    FROM vendors.VendorProfiles v
    WHERE v.IsCompleted = 1 AND v.IsVisible = 1;
    
    -- Pre-compute min prices
    CREATE TABLE #VendorPrices (
        VendorProfileID INT PRIMARY KEY,
        MinPrice DECIMAL(10,2),
        MinServiceName NVARCHAR(200)
    );
    
    INSERT INTO #VendorPrices (VendorProfileID, MinPrice, MinServiceName)
    SELECT 
        v.VendorProfileID,
        COALESCE(v.BasePrice, MinSvc.MinPrice, 0),
        MinSvc.MinServiceName
    FROM vendors.VendorProfiles v
    OUTER APPLY (
        SELECT TOP 1 
            COALESCE(
                CASE WHEN s.PricingModel = 'time_based' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0) ELSE NULL END,
                CASE 
                    WHEN s.PricingModel = 'time_based' THEN s.BaseRate
                    WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
                    WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
                    ELSE s.Price
                END,
                0
            ) AS MinPrice,
            s.Name AS MinServiceName
        FROM vendors.Services s
        WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1
        ORDER BY COALESCE(
            CASE WHEN s.PricingModel = 'time_based' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0) ELSE NULL END,
            CASE 
                WHEN s.PricingModel = 'time_based' THEN s.BaseRate
                WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'fixed_price' THEN s.FixedPrice
                WHEN s.PricingModel = 'fixed_based' AND s.FixedPricingType = 'per_attendee' THEN s.PricePerPerson
                ELSE s.Price
            END,
            999999
        ) ASC
    ) AS MinSvc
    WHERE v.IsCompleted = 1 AND v.IsVisible = 1;
    
    -- Pre-compute primary images and categories
    CREATE TABLE #VendorExtras (
        VendorProfileID INT PRIMARY KEY,
        ImageURL NVARCHAR(500),
        PrimaryCategory NVARCHAR(100),
        Categories NVARCHAR(MAX)
    );
    
    INSERT INTO #VendorExtras (VendorProfileID, ImageURL, PrimaryCategory, Categories)
    SELECT 
        v.VendorProfileID,
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1),
        (SELECT TOP 1 vc.Category FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID),
        (SELECT STRING_AGG(vc.Category, ', ') FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID)
    FROM vendors.VendorProfiles v
    WHERE v.IsCompleted = 1 AND v.IsVisible = 1;
    
    -- Main query with pre-computed data
    ;WITH FilteredVendors AS (
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
            v.DisplayName,
            v.BusinessDescription,
            v.Address,
            v.City,
            v.State,
            v.Country,
            v.PostalCode,
            v.Latitude,
            v.Longitude,
            v.IsPremium,
            v.IsEcoFriendly,
            v.IsAwardWinning,
            v.IsLastMinute,
            v.IsCertified,
            v.IsInsured,
            v.IsMobile,
            v.LogoURL,
            v.CreatedAt,
            v.GooglePlaceId,
            v.InstantBookingEnabled,
            v.YearsInBusiness,
            ISNULL(p.MinPrice, 0) AS MinPrice,
            p.MinServiceName,
            ISNULL(s.AverageRating, 0) AS AverageRating,
            ISNULL(s.ReviewCount, 0) AS ReviewCount,
            ISNULL(s.FavoriteCount, 0) AS FavoriteCount,
            ISNULL(s.BookingCount, 0) AS BookingCount,
            ISNULL(s.ProfileViews, 0) AS ProfileViews,
            e.ImageURL,
            e.PrimaryCategory,
            e.Categories,
            -- Fresh listing indicator (created within last 30 days by default)
            CASE WHEN v.CreatedAt >= DATEADD(DAY, -ISNULL(@FreshListingsDays, 30), GETDATE()) THEN 1 ELSE 0 END AS IsFreshListing,
            -- Recommendation score
            CASE 
                WHEN v.IsPremium = 1 THEN 3
                WHEN ISNULL(s.AverageRating, 0) >= 4.5 THEN 2
                ELSE 1
            END AS RecommendationScore,
            -- Distance calculation
            CASE 
                WHEN @Latitude IS NOT NULL AND @Longitude IS NOT NULL AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
                THEN 3959 * ACOS(
                    CASE 
                        WHEN (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                              SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT)))) > 1 THEN 1
                        WHEN (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                              SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT)))) < -1 THEN -1
                        ELSE (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                              SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT))))
                    END
                )
                ELSE NULL
            END AS DistanceMiles
        FROM vendors.VendorProfiles v
        JOIN users.Users u ON v.UserID = u.UserID
        LEFT JOIN #VendorStats s ON s.VendorProfileID = v.VendorProfileID
        LEFT JOIN #VendorPrices p ON p.VendorProfileID = v.VendorProfileID
        LEFT JOIN #VendorExtras e ON e.VendorProfileID = v.VendorProfileID
        WHERE u.IsActive = 1
        AND v.IsCompleted = 1
        AND v.IsVisible = 1
        -- Search term filter
        AND (@SearchTerm IS NULL OR @SearchTerm = '' OR 
             v.BusinessName LIKE '%' + @SearchTerm + '%' OR 
             v.BusinessDescription LIKE '%' + @SearchTerm + '%' OR
             e.Categories LIKE '%' + @SearchTerm + '%')
        -- Category filter
        AND (@Category IS NULL OR @Category = '' OR 
             EXISTS (SELECT 1 FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
        -- City filter
        AND (@City IS NULL OR @City = '' OR v.City LIKE '%' + @City + '%')
        -- Region filter
        AND (@Region IS NULL OR @Region = '' OR v.State = @Region)
        -- Price range filter (using BasePrice or calculated min price)
        AND (@MinPrice IS NULL OR ISNULL(p.MinPrice, 0) >= @MinPrice)
        AND (@MaxPrice IS NULL OR ISNULL(p.MinPrice, 0) <= @MaxPrice)
        -- Rating filter
        AND (@MinRating IS NULL OR ISNULL(s.AverageRating, 0) >= @MinRating)
        -- Review count filter
        AND (@MinReviewCount IS NULL OR ISNULL(s.ReviewCount, 0) >= @MinReviewCount)
        -- Boolean profile filters
        AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
        AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
        AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
        AND (@IsLastMinute IS NULL OR v.IsLastMinute = @IsLastMinute)
        AND (@IsCertified IS NULL OR v.IsCertified = @IsCertified)
        AND (@IsInsured IS NULL OR v.IsInsured = @IsInsured)
        AND (@IsMobile IS NULL OR v.IsMobile = @IsMobile)
        -- NEW: Instant Booking filter
        AND (@InstantBookingOnly IS NULL OR @InstantBookingOnly = 0 OR v.InstantBookingEnabled = 1)
        -- NEW: Fresh Listings filter
        AND (@FreshListingsDays IS NULL OR v.CreatedAt >= DATEADD(DAY, -@FreshListingsDays, GETDATE()))
        -- NEW: Has Google Reviews filter
        AND (@HasGoogleReviews IS NULL OR @HasGoogleReviews = 0 OR (v.GooglePlaceId IS NOT NULL AND v.GooglePlaceId != ''))
        -- NEW: Availability filter (day of week)
        AND (@AvailabilityDayOfWeek IS NULL OR EXISTS (
            SELECT 1 FROM vendors.VendorBusinessHours bh 
            WHERE bh.VendorProfileID = v.VendorProfileID 
            AND bh.DayOfWeek = @AvailabilityDayOfWeek 
            AND bh.IsAvailable = 1
        ))
        -- NEW: Availability filter (specific date - check no blocking exception)
        AND (@AvailabilityDate IS NULL OR NOT EXISTS (
            SELECT 1 FROM vendors.VendorAvailabilityExceptions ae
            WHERE ae.VendorProfileID = v.VendorProfileID
            AND ae.Date = @AvailabilityDate
            AND ae.IsAvailable = 0
        ))
        -- Event Types filter
        AND (NOT EXISTS (SELECT 1 FROM #EventTypeFilter) OR EXISTS (
            SELECT 1 FROM vendors.VendorEventTypes vet 
            JOIN #EventTypeFilter etf ON vet.EventTypeID = etf.EventTypeID
            WHERE vet.VendorProfileID = v.VendorProfileID
        ))
        -- Cultures filter
        AND (NOT EXISTS (SELECT 1 FROM #CultureFilter) OR EXISTS (
            SELECT 1 FROM vendors.VendorCultures vcul 
            JOIN #CultureFilter cf ON vcul.CultureID = cf.CultureID
            WHERE vcul.VendorProfileID = v.VendorProfileID
        ))
        -- NEW: Feature filter
        AND (NOT EXISTS (SELECT 1 FROM #FeatureFilter) OR EXISTS (
            SELECT 1 FROM vendors.VendorSelectedFeatures vsf 
            JOIN #FeatureFilter ff ON vsf.FeatureID = ff.FeatureID
            WHERE vsf.VendorProfileID = v.VendorProfileID
        ))
        -- NEW: Category Question filter
        AND (NOT EXISTS (SELECT 1 FROM #QuestionFilter) OR NOT EXISTS (
            SELECT 1 FROM #QuestionFilter qf
            WHERE NOT EXISTS (
                SELECT 1 FROM vendors.VendorCategoryAnswers vca
                WHERE vca.VendorProfileID = v.VendorProfileID
                AND vca.QuestionID = qf.QuestionID
                AND vca.Answer = qf.ExpectedAnswer
            )
        ))
        -- Experience range filter
        AND (@ExperienceRange IS NULL OR @ExperienceRange = '' OR
            (@ExperienceRange = '0-1' AND ISNULL(v.YearsInBusiness, 0) < 1) OR
            (@ExperienceRange = '1-2' AND ISNULL(v.YearsInBusiness, 0) >= 1 AND ISNULL(v.YearsInBusiness, 0) < 2) OR
            (@ExperienceRange = '2-5' AND ISNULL(v.YearsInBusiness, 0) >= 2 AND ISNULL(v.YearsInBusiness, 0) < 5) OR
            (@ExperienceRange = '5-10' AND ISNULL(v.YearsInBusiness, 0) >= 5 AND ISNULL(v.YearsInBusiness, 0) < 10) OR
            (@ExperienceRange = '10-15' AND ISNULL(v.YearsInBusiness, 0) >= 10 AND ISNULL(v.YearsInBusiness, 0) < 15) OR
            (@ExperienceRange = '15+' AND ISNULL(v.YearsInBusiness, 0) >= 15)
        )
        -- Service location filter
        AND (@ServiceLocation IS NULL OR @ServiceLocation = '' OR v.ServiceLocationScope = @ServiceLocation)
        -- Distance filter
        AND (@Latitude IS NULL OR @Longitude IS NULL OR v.Latitude IS NULL OR v.Longitude IS NULL OR
             3959 * ACOS(
                CASE 
                    WHEN (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                          SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT)))) > 1 THEN 1
                    WHEN (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                          SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT)))) < -1 THEN -1
                    ELSE (COS(RADIANS(CAST(@Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Latitude AS FLOAT))) * COS(RADIANS(CAST(v.Longitude AS FLOAT)) - RADIANS(CAST(@Longitude AS FLOAT))) + 
                          SIN(RADIANS(CAST(@Latitude AS FLOAT))) * SIN(RADIANS(CAST(v.Latitude AS FLOAT))))
                END
             ) <= @RadiusMiles)
    ),
    TotalCounted AS (
        SELECT COUNT(*) AS TotalCount FROM FilteredVendors
    )
    SELECT 
        f.VendorProfileID AS id,
        f.VendorProfileID,
        f.BusinessName AS name,
        f.DisplayName,
        f.PrimaryCategory AS type,
        CONCAT(f.City, ', ', f.State) AS location,
        f.BusinessDescription AS description,
        '$' + CAST(CAST(f.MinPrice AS INT) AS NVARCHAR(20)) AS price,
        f.MinPrice AS MinPriceNumeric,
        f.MinServiceName AS StartingServiceName,
        CAST(f.AverageRating AS NVARCHAR(10)) AS rating,
        f.ReviewCount,
        f.FavoriteCount,
        f.BookingCount,
        f.ProfileViews,
        f.ImageURL AS image,
        f.IsPremium,
        f.IsEcoFriendly,
        f.IsAwardWinning,
        f.IsLastMinute,
        f.IsCertified,
        f.IsInsured,
        f.IsMobile,
        f.InstantBookingEnabled,
        f.IsFreshListing,
        CASE WHEN f.GooglePlaceId IS NOT NULL AND f.GooglePlaceId != '' THEN 1 ELSE 0 END AS HasGoogleReviews,
        f.Address,
        f.PostalCode,
        f.City,
        f.State,
        f.Country,
        f.Latitude,
        f.Longitude,
        f.Categories,
        f.DistanceMiles,
        f.CreatedAt,
        f.GooglePlaceId,
        f.YearsInBusiness,
        t.TotalCount
    FROM FilteredVendors f
    CROSS JOIN TotalCounted t
    ORDER BY 
        CASE WHEN @SortBy = 'price-low' THEN f.MinPrice ELSE 0 END ASC,
        CASE WHEN @SortBy = 'price-high' THEN f.MinPrice ELSE 0 END DESC,
        CASE WHEN @SortBy = 'rating' THEN f.AverageRating ELSE 0 END DESC,
        CASE WHEN @SortBy = 'reviews' THEN f.ReviewCount ELSE 0 END DESC,
        CASE WHEN @SortBy = 'popular' THEN f.FavoriteCount ELSE 0 END DESC,
        CASE WHEN @SortBy = 'newest' THEN f.CreatedAt ELSE '1900-01-01' END DESC,
        CASE WHEN @SortBy = 'nearest' THEN ISNULL(f.DistanceMiles, 999999) ELSE 0 END ASC,
        CASE WHEN @SortBy = 'recommended' OR @SortBy NOT IN ('price-low', 'price-high', 'rating', 'reviews', 'popular', 'newest', 'nearest') 
             THEN f.RecommendationScore ELSE 0 END DESC,
        f.AverageRating DESC,
        f.ReviewCount DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Cleanup temp tables
    DROP TABLE #VendorStats;
    DROP TABLE #VendorPrices;
    DROP TABLE #VendorExtras;
    DROP TABLE #EventTypeFilter;
    DROP TABLE #CultureFilter;
    DROP TABLE #FeatureFilter;
    DROP TABLE #QuestionFilter;
END;
GO

PRINT 'Created [vendors].[sp_SearchEnhanced] stored procedure';
GO
