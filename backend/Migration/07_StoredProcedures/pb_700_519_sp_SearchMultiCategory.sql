/*
    Migration Script: Create Stored Procedure [vendors].[sp_SearchMultiCategory]
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SearchMultiCategory]'))
    DROP PROCEDURE [vendors].[sp_SearchMultiCategory];
GO


CREATE PROCEDURE [vendors].[sp_SearchMultiCategory]
    @Categories NVARCHAR(500), -- Comma-separated list of categories
    @Budget DECIMAL(10, 2) = NULL,
    @EventDate DATE = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 50,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @SortBy NVARCHAR(20) = 'relevance'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;
    
    -- Parse categories into a table
    DECLARE @CategoryTable TABLE (Category NVARCHAR(50));
    
    IF @Categories IS NOT NULL AND LEN(@Categories) > 0
    BEGIN
        INSERT INTO @CategoryTable (Category)
        SELECT LTRIM(RTRIM(value)) 
        FROM STRING_SPLIT(@Categories, ',')
        WHERE LTRIM(RTRIM(value)) != '';
    END
    
    -- Calculate distance if location provided
    DECLARE @DistanceCalculation NVARCHAR(MAX) = '';
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @DistanceCalculation = ', 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles';
    END
    
    -- Build dynamic SQL for sorting
    DECLARE @SortExpression NVARCHAR(100);
    SET @SortExpression = CASE @SortBy
        WHEN 'price-low' THEN 'TotalEstimatedPrice ASC'
        WHEN 'price-high' THEN 'TotalEstimatedPrice DESC'
        WHEN 'rating' THEN 'AverageRating DESC'
        WHEN 'popular' THEN 'FavoriteCount DESC'
        WHEN 'nearest' THEN 'DistanceMiles ASC'
        WHEN 'relevance' THEN 'CategoryMatchCount DESC, AverageRating DESC'
        ELSE 'BusinessName ASC'
    END;
    
    -- Build the main query
    DECLARE @SQL NVARCHAR(MAX) = '
    WITH VendorCategoryMatches AS (
        SELECT 
            v.VendorProfileID,
            COUNT(DISTINCT vc.Category) AS CategoryMatchCount,
            SUM(ISNULL((
                SELECT MIN(s.Price) 
                FROM vendors.Services s 
                JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID 
                WHERE sc.VendorProfileID = v.VendorProfileID 
                AND sc.Name = vc.Category
            ), 0)) AS TotalEstimatedPrice
        FROM vendors.VendorProfiles v
        JOIN vendors.VendorCategories vc ON v.VendorProfileID = vc.VendorProfileID
        JOIN @CategoryTable ct ON vc.Category = ct.Category
        WHERE v.IsVerified = 1
        GROUP BY v.VendorProfileID
    ),
    FilteredVendors AS (
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
            v.DisplayName,
            v.BusinessDescription,
            v.City,
            v.State,
            v.Country,
            v.Latitude,
            v.Longitude,
            v.IsPremium,
            v.IsEcoFriendly,
            v.IsAwardWinning,
            v.IsCertified,
            v.IsInsured,
            v.IsLocal,
            v.IsMobile,
            v.PriceLevel,
            v.LogoURL,
            vcm.CategoryMatchCount,
            vcm.TotalEstimatedPrice,
            (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
            (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
            (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
            (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
            (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS ImageURL,
            (SELECT STRING_AGG(vc.Category, '', '') FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories'
            + @DistanceCalculation + '
        FROM vendors.VendorProfiles v
        JOIN users.Users u ON v.UserID = u.UserID
        JOIN VendorCategoryMatches vcm ON v.VendorProfileID = vcm.VendorProfileID
        WHERE u.IsActive = 1
        AND v.IsVerified = 1
        AND (@Budget IS NULL OR vcm.TotalEstimatedPrice <= @Budget)
        AND (@City IS NULL OR v.City = @City)
        AND (@State IS NULL OR v.State = @State)'
    
    -- Add location-based filtering using VendorServiceAreas if available
    IF @City IS NOT NULL OR @State IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND EXISTS (
            SELECT 1 FROM VendorServiceAreas vsa 
            WHERE vsa.VendorProfileID = v.VendorProfileID 
            AND (@City IS NULL OR vsa.City = @City)
            AND (@State IS NULL OR vsa.State = @State)
        )'
    END
    
    -- Add distance filter if location provided
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
        AND 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) <= @RadiusMiles'
    END
    
    -- Complete the query with results
    SET @SQL = @SQL + '
    )
    SELECT 
        VendorProfileID AS id,
        BusinessName AS name,
        DisplayName,
        Categories AS type,
        CONCAT(City, '', '', State) AS location,
        BusinessDescription AS description,
        ''$'' + CAST(TotalEstimatedPrice AS NVARCHAR(20)) AS estimatedPrice,
        TotalEstimatedPrice,
        PriceLevel,
        CAST(AverageRating AS NVARCHAR(10)) AS rating,
        ReviewCount,
        FavoriteCount,
        BookingCount,
        ImageURL AS image,
        IsPremium,
        IsEcoFriendly,
        IsAwardWinning,
        Capacity,
        Rooms,
        Categories,
        CategoryMatchCount,
        (SELECT COUNT(*) FROM FilteredVendors) AS TotalCount,
        -- Include all vendor images for carousel
        JSON_QUERY((
            SELECT 
                vi.ImageID,
                vi.ImageURL,
                vi.IsPrimary,
                vi.DisplayOrder,
                vi.ImageType,
                vi.Caption
            FROM vendors.VendorImages vi 
            WHERE vi.VendorProfileID = v.VendorProfileID
            ORDER BY vi.IsPrimary DESC, vi.DisplayOrder
            FOR JSON PATH
        )) AS VendorImages,
        JSON_QUERY((
            SELECT 
                sc.CategoryID,
                sc.Name AS category,
                sc.Description AS categoryDescription,
                JSON_QUERY((
                    SELECT 
                        s.ServiceID,
                        s.Name AS name,
                        s.Description AS description,
                        s.Price,
                        s.DurationMinutes,
                        s.MaxAttendees,
                        s.RequiresDeposit,
                        s.DepositPercentage
                    FROM vendors.Services s
                    WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                    FOR JSON PATH
                )) AS services
            FROM vendors.ServiceCategories sc
            WHERE sc.VendorProfileID = v.VendorProfileID
            FOR JSON PATH
        )) AS services
    FROM FilteredVendors v
    ORDER BY ' + @SortExpression + '
    OFFSET (' + CAST((@PageNumber - 1) * @PageSize AS NVARCHAR(10)) + ') ROWS
    FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(10)) + ' ROWS ONLY'
    
    -- Execute the dynamic SQL
    BEGIN TRY
        EXEC sp_executesql @SQL, 
            N'@Budget DECIMAL(10, 2), @City NVARCHAR(100), @State NVARCHAR(50), 
              @Latitude DECIMAL(10, 8), @Longitude DECIMAL(11, 8), @RadiusMiles INT',
            @Budget, @City, @State, @Latitude, @Longitude, @RadiusMiles
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error searching vendors with multiple categories: %s', 16, 1, @ErrorMessage);
    END CATCH
END;
GO
