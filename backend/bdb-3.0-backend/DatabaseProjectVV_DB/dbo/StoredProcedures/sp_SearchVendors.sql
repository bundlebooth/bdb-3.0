
CREATE PROCEDURE [dbo].[sp_SearchVendors]
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
    IF @PageSize > 100 SET @PageSize = 100;
    
    -- Calculate distance if location provided
    DECLARE @DistanceCalculation NVARCHAR(MAX) = '';
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @DistanceCalculation = ', 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles';
    END
    ELSE
    BEGIN
        SET @DistanceCalculation = ', NULL AS DistanceMiles';
    END
    
    -- Build dynamic SQL for sorting
    DECLARE @SortExpression NVARCHAR(100);
    SET @SortExpression = CASE @SortBy
        WHEN 'price-low' THEN 'MinPrice ASC'
        WHEN 'price-high' THEN 'MinPrice DESC'
        WHEN 'rating' THEN 'AverageRating DESC'
        WHEN 'popular' THEN 'FavoriteCount DESC'
        WHEN 'nearest' THEN 'DistanceMiles ASC'
        ELSE 'BusinessName ASC'
    END;
    
    -- Build the full query with enhanced service and review data
    DECLARE @SQL NVARCHAR(MAX) = '
    WITH FilteredVendors AS (
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
            v.IsLocal,
            v.IsMobile,
            v.PriceLevel,
            v.Capacity,
            v.Rooms,
            v.LogoURL,
            MinSvc.MinPrice AS MinPrice,
            MinSvc.MinServiceName AS MinServiceName,
            (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
            (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
            (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
            (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS ImageURL,
            (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS PrimaryCategory,
            (SELECT STRING_AGG(vc.Category, '', '') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
            CASE 
                WHEN v.IsPremium = 1 THEN 3
                WHEN (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) >= 4.5 THEN 2
                ELSE 1
            END AS RecommendationScore' + @DistanceCalculation + '
        FROM VendorProfiles v
        JOIN Users u ON v.UserID = u.UserID
        OUTER APPLY (
            SELECT TOP 1 
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
                    0
                ) AS MinPrice,
                s.Name AS MinServiceName
            FROM Services s
            WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1
            ORDER BY COALESCE(
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
                999999
            ) ASC
        ) AS MinSvc
        WHERE u.IsActive = 1
        AND v.IsCompleted = 1
        AND v.IsVisible = 1';  -- CRITICAL: Only show vendors that are visible (admin-controlled)
    
    -- Add search term filter
    IF @SearchTerm IS NOT NULL AND @SearchTerm != ''
    BEGIN
        SET @SQL = @SQL + '
        AND (v.BusinessName LIKE ''%' + @SearchTerm + '%'' 
             OR v.BusinessDescription LIKE ''%' + @SearchTerm + '%''
             OR EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category LIKE ''%' + @SearchTerm + '%''))';
    END
    
    -- Add category filter
    IF @Category IS NOT NULL AND @Category != ''
    BEGIN
        SET @SQL = @SQL + '
        AND EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = ''' + @Category + ''')';
    END
    
    -- Add city filter
    IF @City IS NOT NULL AND @City != ''
    BEGIN
        SET @SQL = @SQL + '
        AND v.City LIKE ''%' + @City + '%''';
    END
    
    -- Add price filters
    IF @MinPrice IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND MinSvc.MinPrice >= ' + CAST(@MinPrice AS NVARCHAR(20));
    END
    
    IF @MaxPrice IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND MinSvc.MinPrice <= ' + CAST(@MaxPrice AS NVARCHAR(20));
    END
    
    -- Add rating filter
    IF @MinRating IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) >= ' + CAST(@MinRating AS NVARCHAR(10));
    END
    
    -- Add feature filters
    IF @IsPremium IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND v.IsPremium = ' + CAST(@IsPremium AS NVARCHAR(1));
    END
    
    IF @IsEcoFriendly IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND v.IsEcoFriendly = ' + CAST(@IsEcoFriendly AS NVARCHAR(1));
    END
    
    IF @IsAwardWinning IS NOT NULL
    BEGIN
        SET @SQL = @SQL + ' AND v.IsAwardWinning = ' + CAST(@IsAwardWinning AS NVARCHAR(1));
    END
    
    -- Add location filter
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
        AND 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * COS(RADIANS(v.Latitude)) * COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * SIN(RADIANS(v.Latitude))
        ) <= ' + CAST(@RadiusMiles AS NVARCHAR(10));
    END
    
    -- Add price level filter
    IF @PriceLevel IS NOT NULL AND @PriceLevel != ''
    BEGIN
        SET @SQL = @SQL + ' AND v.PriceLevel = ''' + @PriceLevel + '''';
    END
    
    -- Add availability filter (day of week, start time, end time)
    IF @DayOfWeek IS NOT NULL AND @DayOfWeek != ''
    BEGIN
        DECLARE @DayNumber TINYINT;
        SET @DayNumber = CASE @DayOfWeek
            WHEN 'Sunday' THEN 0
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            ELSE NULL
        END;
        
        IF @DayNumber IS NOT NULL
        BEGIN
            SET @SQL = @SQL + '
            AND EXISTS (
                SELECT 1 FROM VendorBusinessHours vbh 
                WHERE vbh.VendorProfileID = v.VendorProfileID 
                AND vbh.DayOfWeek = ' + CAST(@DayNumber AS NVARCHAR(1)) + ' 
                AND vbh.IsAvailable = 1';
            
            IF @StartTime IS NOT NULL AND @EndTime IS NOT NULL
            BEGIN
                SET @SQL = @SQL + '
                AND vbh.OpenTime < ''' + CAST(@EndTime AS NVARCHAR(20)) + '''
                AND vbh.CloseTime > ''' + CAST(@StartTime AS NVARCHAR(20)) + '''';
            END
            
            SET @SQL = @SQL + '
            )';
        END
    END
    
    -- Add event date availability filter
    IF @EventDate IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND (
            NOT EXISTS (
                SELECT 1 FROM VendorAvailabilityExceptions vae
                WHERE vae.VendorProfileID = v.VendorProfileID 
                AND vae.Date = ''' + CAST(@EventDate AS NVARCHAR(20)) + '''
                AND vae.IsAvailable = 0
            )
            OR EXISTS (
                SELECT 1 FROM VendorAvailabilityExceptions vae
                WHERE vae.VendorProfileID = v.VendorProfileID 
                AND vae.Date = ''' + CAST(@EventDate AS NVARCHAR(20)) + '''
                AND vae.IsAvailable = 1';
        
        IF @StartTime IS NOT NULL AND @EndTime IS NOT NULL
        BEGIN
            SET @SQL = @SQL + '
                AND (vae.StartTime IS NULL OR (vae.StartTime <= ''' + CAST(@StartTime AS NVARCHAR(20)) + ''' AND vae.EndTime >= ''' + CAST(@EndTime AS NVARCHAR(20)) + '''))';
        END
        
        SET @SQL = @SQL + '
            )
        )
        AND NOT EXISTS (
            SELECT 1 FROM Bookings b 
            WHERE b.VendorProfileID = v.VendorProfileID 
            AND CAST(b.EventDate AS DATE) = ''' + CAST(@EventDate AS NVARCHAR(20)) + '''
            AND b.Status IN (''confirmed'', ''pending'')';
        
        IF @StartTime IS NOT NULL AND @EndTime IS NOT NULL
        BEGIN
            SET @SQL = @SQL + '
            AND b.StartTime IS NOT NULL
            AND (
                ''' + CAST(@StartTime AS NVARCHAR(20)) + ''' < b.EndTime 
                AND ''' + CAST(@EndTime AS NVARCHAR(20)) + ''' > b.StartTime
            )';
        END
        
        SET @SQL = @SQL + '
        )';
    END
    
    SET @SQL = @SQL + '
    )
    SELECT 
        VendorProfileID AS id,
        VendorProfileID,
        BusinessName AS name,
        DisplayName,
        PrimaryCategory AS type,
        CONCAT(City, '' '', State) AS location,
        BusinessDescription AS description,
        ''$'' + CAST(MinPrice AS NVARCHAR(20)) AS price,
        MinPrice AS MinPriceNumeric,
        MinServiceName AS StartingServiceName,
        PriceLevel AS priceLevel,
        CAST(AverageRating AS NVARCHAR(10)) AS rating,
        ReviewCount,
        FavoriteCount,
        BookingCount,
        ImageURL AS image,
        IsPremium,
        IsEcoFriendly,
        IsAwardWinning,
        IsLastMinute,
        Capacity,
        Rooms,
        Address,
        PostalCode,
        City,
        State,
        Country,
        Latitude,
        Longitude,
        Categories,
        DistanceMiles,
        (SELECT COUNT(*) FROM FilteredVendors) AS TotalCount,
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
                        s.DepositPercentage,
                        s.CancellationPolicy,
                        s.IsActive
                    FROM Services s
                    WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                    ORDER BY s.Price ASC
                    FOR JSON PATH
                )) AS services
            FROM ServiceCategories sc
            WHERE sc.VendorProfileID = FilteredVendors.VendorProfileID
            ORDER BY sc.Name
            FOR JSON PATH
        )) AS services,
        JSON_QUERY((
            SELECT TOP 3
                r.ReviewID,
                r.Rating,
                r.Title,
                LEFT(r.Comment, 100) + CASE WHEN LEN(r.Comment) > 100 THEN ''...'' ELSE '''' END AS commentPreview,
                r.CreatedAt,
                u.Name AS reviewerName,
                u.ProfileImageURL AS reviewerAvatar,
                (SELECT COUNT(*) FROM ReviewMedia rm WHERE rm.ReviewID = r.ReviewID) AS mediaCount
            FROM Reviews r
            JOIN Users u ON r.UserID = u.UserID
            WHERE r.VendorProfileID = FilteredVendors.VendorProfileID AND r.IsApproved = 1
            ORDER BY r.CreatedAt DESC
            FOR JSON PATH
        )) AS reviews
    FROM FilteredVendors
    ORDER BY ' + @SortExpression + '
    OFFSET (' + CAST((@PageNumber - 1) * @PageSize AS NVARCHAR(10)) + ') ROWS
    FETCH NEXT ' + CAST(@PageSize AS NVARCHAR(10)) + ' ROWS ONLY';
    
    BEGIN TRY
        EXEC sp_executesql @SQL,
            N'@SearchTerm NVARCHAR(100), @Category NVARCHAR(50), @City NVARCHAR(100), @MinPrice DECIMAL(10, 2), @MaxPrice DECIMAL(10, 2), @MinRating DECIMAL(2, 1),
              @IsPremium BIT, @IsEcoFriendly BIT, @IsAwardWinning BIT, @IsLastMinute BIT, @IsCertified BIT, @IsInsured BIT, @IsLocal BIT, @IsMobile BIT,
              @Latitude DECIMAL(10, 8), @Longitude DECIMAL(11, 8), @RadiusMiles INT, @BudgetType NVARCHAR(20), @PricingModelFilter NVARCHAR(20), @FixedPricingTypeFilter NVARCHAR(20),
              @EventDateRaw NVARCHAR(50), @EventStartRaw NVARCHAR(20), @EventEndRaw NVARCHAR(20), @Region NVARCHAR(50), @PriceLevel NVARCHAR(10),
              @EventDate DATE, @DayOfWeek NVARCHAR(10), @StartTime TIME, @EndTime TIME',
            @SearchTerm, @Category, @City, @MinPrice, @MaxPrice, @MinRating, @IsPremium, @IsEcoFriendly, @IsAwardWinning, @IsLastMinute, @IsCertified, @IsInsured, @IsLocal, @IsMobile,
            @Latitude, @Longitude, @RadiusMiles, @BudgetType, @PricingModelFilter, @FixedPricingTypeFilter,
            @EventDateRaw, @EventStartRaw, @EventEndRaw, @Region, @PriceLevel,
            @EventDate, @DayOfWeek, @StartTime, @EndTime
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error searching vendors: %s', 16, 1, @ErrorMessage);
    END CATCH
END;

GO

