
CREATE   PROCEDURE [dbo].[sp_SearchVendors_BACKUP]
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
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
    @PriceLevel NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;
    
    -- Simple query without dynamic SQL to avoid parameter issues
    -- Note: Region parameter is accepted but ignored since the column doesn't exist
    SELECT 
        v.VendorProfileID AS id,
        v.BusinessName AS name,
        v.DisplayName,
        v.BusinessDescription AS description,
        CONCAT(v.City, ', ', v.State) AS location,
        v.Latitude,
        v.Longitude,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning,
        v.PriceLevel,
        v.Capacity,
        v.Rooms,
        COALESCE((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), v.LogoURL) AS image,
        v.LogoURL,
        COALESCE((SELECT MIN(s.Price) FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1), 0) AS MinPrice,
        (SELECT TOP 1 s.Name FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1 ORDER BY s.Price ASC) AS MinServiceName,
        COALESCE((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS AverageRating,
        COALESCE((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS ReviewCount,
        COALESCE((SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID), 0) AS FavoriteCount,
        COALESCE((SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID), 0) AS BookingCount,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS PrimaryCategory,
        (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
        CASE 
            WHEN v.IsPremium = 1 THEN 3
            WHEN (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) >= 4.5 THEN 2
            ELSE 1
        END AS RecommendationScore,
        CASE 
            WHEN @Latitude IS NOT NULL AND @Longitude IS NOT NULL AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
            THEN 3959 * ACOS(
                COS(RADIANS(@Latitude)) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
                SIN(RADIANS(@Latitude)) * SIN(RADIANS(v.Latitude))
            )
            ELSE NULL
        END AS DistanceMiles
    FROM VendorProfiles v
    JOIN Users u ON v.UserID = u.UserID
    WHERE u.IsActive = 1
    AND v.IsCompleted = 1
    AND (@SearchTerm IS NULL OR @SearchTerm = '' OR 
         v.BusinessName LIKE '%' + @SearchTerm + '%' OR 
         v.BusinessDescription LIKE '%' + @SearchTerm + '%' OR
         EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category LIKE '%' + @SearchTerm + '%'))
    AND (@Category IS NULL OR @Category = '' OR 
         EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
    AND (@MinPrice IS NULL OR 
         (SELECT MIN(s.Price) FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1) >= @MinPrice)
    AND (@MaxPrice IS NULL OR 
         (SELECT MIN(s.Price) FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1) <= @MaxPrice)
    AND (@MinRating IS NULL OR 
         (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) >= @MinRating)
    AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
    AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
    AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
    AND (@PriceLevel IS NULL OR @PriceLevel = '' OR v.PriceLevel = @PriceLevel)
    AND (@Latitude IS NULL OR @Longitude IS NULL OR v.Latitude IS NULL OR v.Longitude IS NULL OR
         3959 * ACOS(
            COS(RADIANS(@Latitude)) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
            SIN(RADIANS(@Latitude)) * SIN(RADIANS(v.Latitude))
         ) <= @RadiusMiles)
    -- Note: @Region parameter is ignored since Region column doesn't exist in VendorProfiles table
    ORDER BY 
        CASE @SortBy
            WHEN 'price-low' THEN (SELECT MIN(s.Price) FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1)
            ELSE NULL
        END ASC,
        CASE @SortBy
            WHEN 'price-high' THEN (SELECT MIN(s.Price) FROM Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1)
            ELSE NULL
        END DESC,
        CASE @SortBy
            WHEN 'rating' THEN (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)
            ELSE NULL
        END DESC,
        CASE @SortBy
            WHEN 'popular' THEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID)
            ELSE NULL
        END DESC,
        v.BusinessName ASC
    OFFSET ((@PageNumber - 1) * @PageSize) ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;

GO

