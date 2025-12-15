/*
    Migration Script: Create Stored Procedure [sp_SearchVendorsByPredefinedServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_091_dbo.sp_SearchVendorsByPredefinedServices.sql
    Description: Creates the [dbo].[sp_SearchVendorsByPredefinedServices] stored procedure
    
    Execution Order: 91
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_SearchVendorsByPredefinedServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_SearchVendorsByPredefinedServices]'))
    DROP PROCEDURE [dbo].[sp_SearchVendorsByPredefinedServices];
GO

CREATE   PROCEDURE [dbo].[sp_SearchVendorsByPredefinedServices]
    @ServiceIds NVARCHAR(500), -- Comma-separated list of predefined service IDs
    @Budget DECIMAL(10, 2) = NULL,
    @EventDate DATE = NULL,
    @EventStartRaw NVARCHAR(20) = NULL,
    @EventEndRaw NVARCHAR(20) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 50,
    @PageNumber INT = 1,
    @PageSize INT = 100,
    @SortBy NVARCHAR(20) = 'relevance',
    @BudgetType NVARCHAR(20) = NULL,              -- 'total' | 'per_person'
    @PricingModelFilter NVARCHAR(20) = NULL,      -- 'time_based' | 'fixed_based'
    @FixedPricingTypeFilter NVARCHAR(20) = NULL   -- 'fixed_price' | 'per_attendee'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate pagination parameters
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 SET @PageSize = 10;
    IF @PageSize > 100 SET @PageSize = 100;
    
    -- Build sort expression
    DECLARE @SortExpression NVARCHAR(100);
    SET @SortExpression = CASE @SortBy
        WHEN 'price-low' THEN 'TotalEstimatedPrice ASC'
        WHEN 'price-high' THEN 'TotalEstimatedPrice DESC'
        WHEN 'rating' THEN 'AverageRating DESC'
        WHEN 'popular' THEN 'FavoriteCount DESC'
        WHEN 'nearest' THEN 'DistanceMiles ASC'
        ELSE 'MatchingServices DESC, IsPremium DESC'
    END;
    
    -- Calculate distance if location provided
    DECLARE @DistanceCalculation NVARCHAR(MAX) = '';
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @DistanceCalculation = ', 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles';
    END
    
    -- Build dynamic SQL query
    DECLARE @SQL NVARCHAR(MAX) = '
    WITH VendorServiceMatches AS (
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
            v.PriceLevel,
            v.Capacity,
            v.Rooms,
            v.LogoURL,
            COUNT(DISTINCT vss.PredefinedServiceID) as MatchingServices,
            SUM(
                COALESCE(
                    CASE 
                        WHEN s.PricingModel = ''time_based'' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0)
                            ELSE NULL
                    END,
                    CASE 
                        WHEN s.PricingModel = ''time_based'' THEN s.BaseRate
                        WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''fixed_price'' THEN s.FixedPrice
                        WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''per_attendee'' THEN CASE WHEN @BudgetType = ''per_person'' THEN s.PricePerPerson ELSE s.Price END
                        ELSE s.Price
                    END,
                    vss.VendorPrice
                )
            ) as TotalEstimatedPrice,
            (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
            (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
            (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
            (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS ImageURL,
            STRING_AGG(ps.ServiceName, '', '') AS MatchingServiceNames'
            + @DistanceCalculation + '
        FROM VendorProfiles v
        JOIN Users u ON v.UserID = u.UserID
        JOIN VendorSelectedServices vss ON v.VendorProfileID = vss.VendorProfileID
        JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
        LEFT JOIN Services s ON s.VendorProfileID = v.VendorProfileID AND s.LinkedPredefinedServiceID = vss.PredefinedServiceID AND s.IsActive = 1
        WHERE u.IsActive = 1
        AND v.IsVerified = 1
        AND vss.PredefinedServiceID IN (' + @ServiceIds + ')
        AND (
            @Budget IS NULL OR 
            COALESCE(
                CASE 
                    WHEN s.PricingModel = ''time_based'' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0)
                        ELSE NULL
                END,
                CASE 
                    WHEN s.PricingModel = ''time_based'' THEN s.BaseRate
                    WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''fixed_price'' THEN s.FixedPrice
                    WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''per_attendee'' THEN CASE WHEN @BudgetType = ''per_person'' THEN s.PricePerPerson ELSE s.Price END
                    ELSE s.Price
                END,
                vss.VendorPrice
            ) <= @Budget
        )
        AND (@PricingModelFilter IS NULL OR s.PricingModel = @PricingModelFilter)
        AND (@FixedPricingTypeFilter IS NULL OR s.FixedPricingType = @FixedPricingTypeFilter)
        AND (@City IS NULL OR v.City = @City)
        AND (@State IS NULL OR v.State = @State)
        AND (
            @EventDate IS NULL OR EXISTS (
                SELECT 1
                FROM VendorBusinessHours vbh
                WHERE vbh.VendorProfileID = v.VendorProfileID
                  AND vbh.IsAvailable = 1
                  AND vbh.DayOfWeek = CASE DATENAME(WEEKDAY, @EventDate)
                                        WHEN ''Sunday'' THEN 0
                                        WHEN ''Monday'' THEN 1
                                        WHEN ''Tuesday'' THEN 2
                                        WHEN ''Wednesday'' THEN 3
                                        WHEN ''Thursday'' THEN 4
                                        WHEN ''Friday'' THEN 5
                                        WHEN ''Saturday'' THEN 6
                                      END
                  AND (@EventStartRaw IS NULL OR vbh.OpenTime <= TRY_CONVERT(time, @EventStartRaw))
                  AND (@EventEndRaw IS NULL OR vbh.CloseTime >= TRY_CONVERT(time, @EventEndRaw))
            )
        )';
    
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
        AND 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) <= @RadiusMiles';
    END
    
    SET @SQL = @SQL + '
        GROUP BY v.VendorProfileID, v.BusinessName, v.DisplayName, v.BusinessDescription,
                 v.City, v.State, v.Country, v.Latitude, v.Longitude, v.IsPremium, 
                 v.IsEcoFriendly, v.IsAwardWinning, v.PriceLevel, v.Capacity, v.Rooms, v.LogoURL
        HAVING COUNT(DISTINCT vss.PredefinedServiceID) >= 1
    )
    SELECT 
        VendorProfileID AS id,
        BusinessName AS name,
        DisplayName,
        BusinessDescription AS description,
        CONCAT(City, '', '', State) AS location,
        Latitude,
        Longitude,
        IsPremium,
        IsEcoFriendly,
        IsAwardWinning,
        PriceLevel,
        Capacity,
        Rooms,
        ImageURL AS image,
        LogoURL,
        MatchingServices,
        TotalEstimatedPrice,
        AverageRating,
        ReviewCount,
        FavoriteCount,
        BookingCount,
        MatchingServiceNames,
        JSON_QUERY((
            SELECT 
                vi.ImageID,
                vi.ImageURL,
                vi.IsPrimary,
                vi.DisplayOrder,
                vi.ImageType,
                vi.Caption
            FROM VendorImages vi 
            WHERE vi.VendorProfileID = vsm.VendorProfileID
            ORDER BY vi.IsPrimary DESC, vi.DisplayOrder
            FOR JSON PATH
        )) AS VendorImages,
        JSON_QUERY((
            SELECT 
                ps.ServiceName AS name,
                ps.Category,
                COALESCE(
                    CASE 
                        WHEN s.PricingModel = ''time_based'' THEN NULLIF(ISNULL(s.MinimumBookingFee, 0), 0)
                            ELSE NULL
                    END,
                    CASE 
                        WHEN s.PricingModel = ''time_based'' THEN s.BaseRate
                        WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''fixed_price'' THEN s.FixedPrice
                        WHEN s.PricingModel = ''fixed_based'' AND s.FixedPricingType = ''per_attendee'' THEN CASE WHEN @BudgetType = ''per_person'' THEN s.PricePerPerson ELSE s.Price END
                        ELSE s.Price
                    END,
                    vss.VendorPrice
                ) AS Price,
                vss.VendorDescription AS description,
                vss.VendorDurationMinutes AS DurationMinutes,
                s.PricingModel,
                s.BaseDurationMinutes,
                s.BaseRate,
                s.OvertimeRatePerHour,
                s.MinimumBookingFee,
                s.FixedPricingType,
                s.FixedPrice,
                s.PricePerPerson,
                s.MinimumAttendees,
                s.MaximumAttendees
            FROM VendorSelectedServices vss
            JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
            LEFT JOIN Services s ON s.VendorProfileID = vsm.VendorProfileID AND s.LinkedPredefinedServiceID = vss.PredefinedServiceID AND s.IsActive = 1
            WHERE vss.VendorProfileID = vsm.VendorProfileID
            AND vss.PredefinedServiceID IN (' + @ServiceIds + ')
            FOR JSON PATH
        )) AS services';
        
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ', DistanceMiles';
    END
    
    SET @SQL = @SQL + '
    FROM VendorServiceMatches vsm
    ORDER BY ' + @SortExpression + '
    OFFSET (' + CAST((@PageNumber - 1) * @PageSize AS NVARCHAR(10)) + ') ROWS
    FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(10)) + ' ROWS ONLY';
    
    -- Execute the dynamic SQL
    BEGIN TRY
        EXEC sp_executesql @SQL, 
            N'@Budget DECIMAL(10, 2), @City NVARCHAR(100), @State NVARCHAR(50), 
              @Latitude DECIMAL(10, 8), @Longitude DECIMAL(11, 8), @RadiusMiles INT,
              @BudgetType NVARCHAR(20), @PricingModelFilter NVARCHAR(20), @FixedPricingTypeFilter NVARCHAR(20),
              @EventDate DATE, @EventStartRaw NVARCHAR(20), @EventEndRaw NVARCHAR(20)',
            @Budget, @City, @State, @Latitude, @Longitude, @RadiusMiles,
            @BudgetType, @PricingModelFilter, @FixedPricingTypeFilter,
            @EventDate, @EventStartRaw, @EventEndRaw;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error searching vendors by predefined services: %s', 16, 1, @ErrorMessage);
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_SearchVendorsByPredefinedServices] created successfully.';
GO
