/*
    Migration Script: Create Stored Procedure [vendors].[sp_Search]
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Search]'))
    DROP PROCEDURE [vendors].[sp_Search];
GO


CREATE PROCEDURE [vendors].[sp_Search]
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
    @City NVARCHAR(100) = NULL,
    @MinPrice DECIMAL(10, 2) = NULL,
    @MaxPrice DECIMAL(10, 2) = NULL,
    @MinRating DECIMAL(2, 1) = NULL,
    @IsPremium BIT = NULL,
    @IsEcoFriendly BIT = NULL,
    @IsAwardWinning BIT = NULL,
    @IsLastMinute BIT = NULL,
    @IsCertified BIT = NULL,
    @IsInsured BIT = NULL,
    @IsLocal BIT = NULL,
    @IsMobile BIT = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 25,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'recommended',
    @BudgetType NVARCHAR(20) = NULL,
    @PricingModelFilter NVARCHAR(20) = NULL,
    @FixedPricingTypeFilter NVARCHAR(20) = NULL,
    @EventDateRaw NVARCHAR(50) = NULL,
    @EventStartRaw NVARCHAR(20) = NULL,
    @EventEndRaw NVARCHAR(20) = NULL,
    @Region NVARCHAR(50) = NULL,
    @PriceLevel NVARCHAR(10) = NULL,
    @EventDate DATE = NULL,
    @DayOfWeek NVARCHAR(10) = NULL,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 200 SET @PageSize = 200;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Pre-compute aggregates into temp table for performance
    CREATE TABLE #VendorStats (
        VendorProfileID INT PRIMARY KEY,
        AverageRating DECIMAL(3,1),
        ReviewCount INT,
        FavoriteCount INT,
        BookingCount INT,
        ProfileViews INT,
        AvgResponseMinutes INT
    );
    
    INSERT INTO #VendorStats (VendorProfileID, AverageRating, ReviewCount, FavoriteCount, BookingCount, ProfileViews, AvgResponseMinutes)
    SELECT 
        v.VendorProfileID,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1),
        (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1),
        (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID),
        (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.VendorProfileID = v.VendorProfileID AND b.CreatedAt >= DATEADD(DAY, -30, GETDATE())),
        (SELECT COUNT(*) FROM vendors.VendorProfileViews pv WHERE pv.VendorProfileID = v.VendorProfileID),
        (SELECT TOP 1 rt.AvgResponseMinutes FROM vendors.vw_VendorResponseTimes rt WHERE rt.VendorProfileID = v.VendorProfileID)
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
        MinSvc.MinPrice,
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
            v.PriceLevel,
            v.LogoURL,
            v.CreatedAt,
            v.GooglePlaceId,
            ISNULL(p.MinPrice, 0) AS MinPrice,
            p.MinServiceName,
            ISNULL(s.AverageRating, 0) AS AverageRating,
            ISNULL(s.ReviewCount, 0) AS ReviewCount,
            ISNULL(s.FavoriteCount, 0) AS FavoriteCount,
            ISNULL(s.BookingCount, 0) AS BookingCount,
            ISNULL(s.ProfileViews, 0) AS ProfileViews,
            s.AvgResponseMinutes,
            e.ImageURL,
            e.PrimaryCategory,
            e.Categories,
            CASE 
                WHEN v.IsPremium = 1 THEN 3
                WHEN ISNULL(s.AverageRating, 0) >= 4.5 THEN 2
                ELSE 1
            END AS RecommendationScore,
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
        AND (@SearchTerm IS NULL OR @SearchTerm = '' OR 
             v.BusinessName LIKE '%' + @SearchTerm + '%' OR 
             v.BusinessDescription LIKE '%' + @SearchTerm + '%' OR
             e.Categories LIKE '%' + @SearchTerm + '%')
        AND (@Category IS NULL OR @Category = '' OR 
             EXISTS (SELECT 1 FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
        AND (@City IS NULL OR @City = '' OR v.City LIKE '%' + @City + '%')
        AND (@MinPrice IS NULL OR ISNULL(p.MinPrice, 0) >= @MinPrice)
        AND (@MaxPrice IS NULL OR ISNULL(p.MinPrice, 0) <= @MaxPrice)
        AND (@MinRating IS NULL OR ISNULL(s.AverageRating, 0) >= @MinRating)
        AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
        AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
        AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
        AND (@PriceLevel IS NULL OR @PriceLevel = '' OR v.PriceLevel = @PriceLevel)
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
        CONCAT(f.City, ' ', f.State) AS location,
        f.BusinessDescription AS description,
        '$' + CAST(f.MinPrice AS NVARCHAR(20)) AS price,
        f.MinPrice AS MinPriceNumeric,
        f.MinServiceName AS StartingServiceName,
        f.PriceLevel AS priceLevel,
        CAST(f.AverageRating AS NVARCHAR(10)) AS rating,
        f.ReviewCount,
        f.FavoriteCount,
        f.BookingCount,
        f.ProfileViews,
        f.AvgResponseMinutes,
        f.ImageURL AS image,
        f.IsPremium,
        f.IsEcoFriendly,
        f.IsAwardWinning,
        f.IsLastMinute,
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
        t.TotalCount,
        NULL AS services,
        NULL AS reviews
    FROM FilteredVendors f
    CROSS JOIN TotalCounted t
    ORDER BY 
        CASE WHEN @SortBy = 'price-low' THEN f.MinPrice ELSE 0 END ASC,
        CASE WHEN @SortBy = 'price-high' THEN f.MinPrice ELSE 0 END DESC,
        CASE WHEN @SortBy = 'rating' THEN f.AverageRating ELSE 0 END DESC,
        CASE WHEN @SortBy = 'popular' THEN f.FavoriteCount ELSE 0 END DESC,
        CASE WHEN @SortBy = 'nearest' THEN ISNULL(f.DistanceMiles, 999999) ELSE 0 END ASC,
        CASE WHEN @SortBy NOT IN ('price-low', 'price-high', 'rating', 'popular', 'nearest') THEN f.BusinessName ELSE '' END ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Cleanup temp tables
    DROP TABLE #VendorStats;
    DROP TABLE #VendorPrices;
    DROP TABLE #VendorExtras;
END;
GO
