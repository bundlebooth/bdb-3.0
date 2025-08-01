-- Section 11: Stored Procedures - Provider Management

-- sp_Provider_Search: Search providers with filters
CREATE PROCEDURE sp_Provider_Search
    @SearchTerm NVARCHAR(100) = NULL,
    @ProviderTypeID INT = NULL,
    @Category NVARCHAR(50) = NULL,
    @Location NVARCHAR(100) = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = NULL,
    @MinPrice DECIMAL(18, 2) = NULL,
    @MaxPrice DECIMAL(18, 2) = NULL,
    @MinRating DECIMAL(3, 2) = NULL,
    @EventDate DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'rating',
    @SortDirection NVARCHAR(4) = 'DESC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- Create temp table for results
    CREATE TABLE #SearchResults (
        ProviderID INT,
        BusinessName NVARCHAR(255),
        BusinessDescription NVARCHAR(MAX),
        ProviderType NVARCHAR(100),
        Category NVARCHAR(50),
        City NVARCHAR(100),
        StateProvince NVARCHAR(100),
        Country NVARCHAR(100),
        Latitude DECIMAL(10, 8),
        Longitude DECIMAL(11, 8),
        AverageRating DECIMAL(5,2),
        ReviewCount INT,
        BasePrice DECIMAL(18, 2),
        PrimaryImage NVARCHAR(255),
        DistanceMiles FLOAT,
        IsAvailable BIT,
        RowNum INT
    );

    -- Insert base results
    INSERT INTO #SearchResults (
        ProviderID, BusinessName, BusinessDescription, ProviderType, Category,
        City, StateProvince, Country, Latitude, Longitude, AverageRating,
        ReviewCount, BasePrice, PrimaryImage
    )
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        sp.BusinessDescription,
        pt.TypeName AS ProviderType,
        pt.Category,
        pl.City,
        pl.StateProvince,
        pl.Country,
        pl.Latitude,
        pl.Longitude,
        ISNULL((SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS AverageRating,
        ISNULL((SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS ReviewCount,
        sp.BasePrice,
        (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
    WHERE 
        sp.IsActive = 1
        AND (@ProviderTypeID IS NULL OR sp.TypeID = @ProviderTypeID)
        AND (@Category IS NULL OR pt.Category = @Category)
        AND (@SearchTerm IS NULL OR sp.BusinessName LIKE '%' + @SearchTerm + '%' OR sp.BusinessDescription LIKE '%' + @SearchTerm + '%')
        AND (@Location IS NULL OR pl.City LIKE '%' + @Location + '%' OR pl.StateProvince LIKE '%' + @Location + '%');

    -- Calculate distance if location provided
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        UPDATE #SearchResults
        SET DistanceMiles = geography::Point(Latitude, Longitude, 4326).STDistance(geography::Point(@Latitude, @Longitude, 4326)) * 0.000621371 -- Convert meters to miles
        WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;

        -- Filter by radius if specified
        IF @RadiusMiles IS NOT NULL
        BEGIN
            DELETE FROM #SearchResults
            WHERE DistanceMiles > @RadiusMiles OR DistanceMiles IS NULL;
        END
    END
    
    -- Filter by price range
    IF @MinPrice IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE BasePrice < @MinPrice OR BasePrice IS NULL;
    END
    
    IF @MaxPrice IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE BasePrice > @MaxPrice;
    END
    
    -- Filter by rating
    IF @MinRating IS NOT NULL
    BEGIN
        DELETE FROM #SearchResults
        WHERE AverageRating < @MinRating OR ReviewCount = 0;
    END
    
    -- Check availability for specific date
    IF @EventDate IS NOT NULL
    BEGIN
        UPDATE sr
        SET sr.IsAvailable = CASE 
            WHEN EXISTS (
                SELECT 1 FROM ProviderBlackoutDates bd 
                WHERE bd.ProviderID = sr.ProviderID 
                AND @EventDate BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM Bookings b 
                INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
                WHERE bp.ProviderID = sr.ProviderID 
                AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
                AND @EventDate = b.EventDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM ProviderAvailability pa 
                WHERE pa.ProviderID = sr.ProviderID 
                AND pa.DayOfWeek = DATEPART(WEEKDAY, @EventDate)
                AND pa.IsAvailable = 1
            ) THEN 1
            ELSE 0
        END
        FROM #SearchResults sr;

        -- Remove unavailable providers
        DELETE FROM #SearchResults
        WHERE IsAvailable = 0;
    END
    
    -- Apply sorting
    DECLARE @SortSQL NVARCHAR(MAX);
    SET @SortSQL = N'
    UPDATE #SearchResults
    SET RowNum = ROW_NUMBER() OVER (ORDER BY ' + 
        CASE @SortBy
            WHEN 'price' THEN 'BasePrice'
            WHEN 'name' THEN 'BusinessName'
            WHEN 'distance' THEN 'DistanceMiles'
            ELSE 'AverageRating'
        END + ' ' + @SortDirection + ')';
    EXEC sp_executesql @SortSQL;

    -- Return paginated results
    SELECT 
        ProviderID,
        BusinessName,
        BusinessDescription,
        ProviderType,
        Category,
        City,
        StateProvince,
        Country,
        Latitude,
        Longitude,
        AverageRating,
        ReviewCount,
        BasePrice,
        PrimaryImage,
        DistanceMiles,
        (SELECT COUNT(*) FROM #SearchResults) AS TotalCount
    FROM 
        #SearchResults
    WHERE 
        RowNum > @Offset AND RowNum <= @Offset + @PageSize
    ORDER BY 
        RowNum;

    DROP TABLE #SearchResults;
END;
GO

-- sp_Provider_Create: Add new provider
CREATE PROCEDURE sp_Provider_Create
    @UserID INT,
    @BusinessName NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @TypeID INT,
    @YearsExperience INT = NULL,
    @IsMobile BIT = 0,
    @TravelRadius INT = NULL,
    @BasePrice DECIMAL(18, 2) = NULL,
    @MinEventSize INT = NULL,
    @MaxEventSize INT = NULL,
    @IsInsured BIT = 0,
    @InsuranceDetails NVARCHAR(255) = NULL,
    @ProviderID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert new provider
        INSERT INTO ServiceProviders (
            UserID, BusinessName, BusinessDescription, TypeID, YearsExperience,
            IsMobile, TravelRadius, BasePrice, MinEventSize, MaxEventSize,
            IsInsured, InsuranceDetails, IsActive
        )
        VALUES (
            @UserID, @BusinessName, @BusinessDescription, @TypeID, @YearsExperience,
            @IsMobile, @TravelRadius, @BasePrice, @MinEventSize, @MaxEventSize,
            @IsInsured, @InsuranceDetails, 1
        );

        SET @ProviderID = SCOPE_IDENTITY();

        -- Update user role to include provider role if not already set
        IF NOT EXISTS (
            SELECT 1 FROM UserRoleMappings urm
            INNER JOIN UserRoles ur ON urm.RoleID = ur.RoleID
            WHERE urm.UserID = @UserID AND ur.RoleName IN ('VenueOwner', 'ServiceProvider')
        )
        BEGIN
            DECLARE @ProviderRoleID INT;

            -- Try to get ServiceProvider role first
            SELECT @ProviderRoleID = RoleID 
            FROM UserRoles 
            WHERE RoleName = 'ServiceProvider';

            -- Fallback to VenueOwner if ServiceProvider doesn't exist
            IF @ProviderRoleID IS NULL
            BEGIN
                SELECT @ProviderRoleID = RoleID 
                FROM UserRoles 
                WHERE RoleName = 'VenueOwner';
            END
            
            -- If neither exists, create ServiceProvider role
            IF @ProviderRoleID IS NULL
            BEGIN
                INSERT INTO UserRoles (RoleName, Description, IsActive)
                VALUES ('ServiceProvider', 'Service provider account', 1);
                SET @ProviderRoleID = SCOPE_IDENTITY();
            END
            
            -- Add role mapping
            INSERT INTO UserRoleMappings (UserID, RoleID)
            VALUES (@UserID, @ProviderRoleID);
        END
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_Provider_Update: Modify provider details
CREATE PROCEDURE sp_Provider_Update
    @ProviderID INT,
    @BusinessName NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @TypeID INT,
    @YearsExperience INT = NULL,
    @IsMobile BIT = 0,
    @TravelRadius INT = NULL,
    @BasePrice DECIMAL(18, 2) = NULL,
    @MinEventSize INT = NULL,
    @MaxEventSize INT = NULL,
    @IsInsured BIT = 0,
    @InsuranceDetails NVARCHAR(255) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ServiceProviders
    SET 
        BusinessName = @BusinessName,
        BusinessDescription = @BusinessDescription,
        TypeID = @TypeID,
        YearsExperience = @YearsExperience,
        IsMobile = @IsMobile,
        TravelRadius = @TravelRadius,
        BasePrice = @BasePrice,
        MinEventSize = @MinEventSize,
        MaxEventSize = @MaxEventSize,
        IsInsured = @IsInsured,
        InsuranceDetails = @InsuranceDetails,
        IsActive = @IsActive,
        LastUpdated = GETDATE()
    WHERE 
        ProviderID = @ProviderID;

    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Provider not found.', 16, 1);
    END
END;
GO

-- sp_Provider_GetFullProfile: Get complete provider details
CREATE PROCEDURE sp_Provider_GetFullProfile
    @ProviderID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Basic provider info
    SELECT 
        sp.ProviderID,
        sp.BusinessName,
        sp.BusinessDescription,
        pt.TypeID,
        pt.TypeName AS ProviderType,
        pt.Category AS ProviderCategory,
        sp.YearsExperience,
        sp.IsMobile,
        sp.TravelRadius,
        sp.BasePrice,
        sp.MinEventSize,
        sp.MaxEventSize,
        sp.IsInsured,
        sp.InsuranceDetails,
        sp.IsFeatured,
        sp.IsVerified,
        sp.IsActive,
        u.FirstName + ' ' + u.LastName AS OwnerName,
        u.Email AS OwnerEmail,
        u.PhoneNumber AS OwnerPhone,
        u.AvatarURL AS OwnerAvatar,
        (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
        (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount
    FROM 
        ServiceProviders sp
        INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
        INNER JOIN Users u ON sp.UserID = u.UserID
    WHERE 
        sp.ProviderID = @ProviderID;

    -- Location info
    SELECT 
        LocationID,
        AddressLine1,
        AddressLine2,
        City,
        StateProvince,
        PostalCode,
        Country,
        Latitude,
        Longitude,
        IsPrimary
    FROM 
        ProviderLocations
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        IsPrimary DESC;

    -- Services
    SELECT 
        ProviderServiceID,
        ServiceName,
        Description,
        BasePrice,
        PriceType,
        MinDuration,
        IsActive
    FROM 
        ProviderServices
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        ServiceName;

    -- Service packages
    SELECT 
        PackageID,
        PackageName,
        Description,
        Price,
        IncludedServices,
        IsActive
    FROM 
        ProviderServicePackages
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        PackageName;

    -- Availability
    SELECT 
        AvailabilityID,
        DayOfWeek,
        StartTime,
        EndTime,
        IsAvailable,
        Notes
    FROM 
        ProviderAvailability
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        DayOfWeek, StartTime;

    -- Blackout dates
    SELECT 
        BlackoutID,
        StartDate,
        EndDate,
        Reason,
        IsRecurring,
        RecurrencePattern
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (EndDate >= GETDATE() OR IsRecurring = 1)
    ORDER BY 
        StartDate;

    -- Equipment
    SELECT 
        EquipmentID,
        EquipmentName,
        Description,
        Quantity,
        IncludedInBasePrice
    FROM 
        ProviderEquipment
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        EquipmentName;

    -- Portfolio items
    SELECT 
        PortfolioID,
        Title,
        Description,
        ImageURL,
        VideoURL,
        DisplayOrder,
        IsFeatured
    FROM 
        ProviderPortfolio
    WHERE 
        ProviderID = @ProviderID
    ORDER BY 
        IsFeatured DESC, DisplayOrder;

    -- Reviews
    SELECT 
        pr.ReviewID,
        pr.Rating,
        pr.ReviewText,
        pr.ReviewDate,
        pr.ResponseText,
        pr.ResponseDate,
        u.UserID,
        u.FirstName + ' ' + u.LastName AS ReviewerName,
        u.AvatarURL AS ReviewerAvatar,
        b.EventName,
        b.EventDate
    FROM 
        ProviderReviews pr
        INNER JOIN Users u ON pr.UserID = u.UserID
        LEFT JOIN Bookings b ON pr.BookingID = b.BookingID
    WHERE 
        pr.ProviderID = @ProviderID
        AND pr.IsApproved = 1
    ORDER BY 
        pr.ReviewDate DESC;

    -- Detailed review categories
    IF EXISTS (SELECT 1 FROM ReviewCategories rc INNER JOIN ProviderTypes pt ON rc.ProviderTypeID = pt.TypeID INNER JOIN ServiceProviders sp ON pt.TypeID = sp.TypeID WHERE sp.ProviderID = @ProviderID)
    BEGIN
        -- Get average ratings by category
        SELECT 
            rc.CategoryID,
            rc.CategoryName,
            rc.Description,
            AVG(CAST(rcr.Rating AS DECIMAL(5,2))) AS AverageRating,
            COUNT(rcr.RatingID) AS RatingCount
        FROM 
            ReviewCategories rc
            LEFT JOIN ReviewCategoryRatings rcr ON rc.CategoryID = rcr.CategoryID
            LEFT JOIN ProviderReviews pr ON rcr.ReviewID = pr.ReviewID AND pr.ProviderID = @ProviderID
        WHERE 
            rc.ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID)
        GROUP BY 
            rc.CategoryID, rc.CategoryName, rc.Description
        ORDER BY 
            rc.CategoryName;
    END
END;
GO

-- sp_Provider_GetAvailability: Check availability for a provider
CREATE PROCEDURE sp_Provider_GetAvailability
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
        RETURN;
    END
    
    -- Create temp table for dates
    CREATE TABLE #DateRange (
        DateValue DATE
    );
    
    -- Populate date range
    DECLARE @CurrentDate DATE = @StartDate;
    WHILE @CurrentDate <= @EndDate
    BEGIN
        INSERT INTO #DateRange (DateValue) VALUES (@CurrentDate);
        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
    END
    
    -- Get provider's weekly availability
    DECLARE @WeeklyAvailability TABLE (
        DayOfWeek TINYINT,
        StartTime TIME,
        EndTime TIME,
        IsAvailable BIT
    );
    
    INSERT INTO @WeeklyAvailability
    SELECT 
        DayOfWeek,
        StartTime,
        EndTime,
        IsAvailable
    FROM 
        ProviderAvailability
    WHERE 
        ProviderID = @ProviderID;
    
    -- Get blackout dates
    DECLARE @BlackoutDates TABLE (
        StartDate DATE,
        EndDate DATE
    );
    
    INSERT INTO @BlackoutDates
    SELECT 
        StartDate,
        EndDate
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (StartDate <= @EndDate AND EndDate >= @StartDate) OR
            IsRecurring = 1
        );
    
    -- Get booked dates
    DECLARE @BookedDates TABLE (
        EventDate DATE,
        StartTime TIME,
        EndTime TIME
    );
    
    INSERT INTO @BookedDates
    SELECT 
        b.EventDate,
        b.StartTime,
        b.EndTime
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'));
    
    -- Return availability for each date
    SELECT 
        dr.DateValue,
        wa.DayOfWeek,
        wa.StartTime AS DefaultStartTime,
        wa.EndTime AS DefaultEndTime,
        wa.IsAvailable AS DefaultAvailable,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM @BlackoutDates bd 
                WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @BookedDates bd 
                WHERE bd.EventDate = dr.DateValue
            ) THEN 0
            WHEN EXISTS (
                SELECT 1 FROM @WeeklyAvailability wa2 
                WHERE wa2.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue) 
                AND wa2.IsAvailable = 1
            ) THEN 1
            ELSE 0
        END AS IsAvailable,
        (
            SELECT STRING_AGG(CONVERT(NVARCHAR(5), bd.StartTime) + ' - ' + CONVERT(NVARCHAR(5), bd.EndTime), ', ')
            FROM @BookedDates bd 
            WHERE bd.EventDate = dr.DateValue
        ) AS BookedSlots,
        (
            SELECT TOP 1 bd.Reason 
            FROM ProviderBlackoutDates bd 
            WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
            AND bd.ProviderID = @ProviderID
        ) AS BlackoutReason
    FROM 
        #DateRange dr
        LEFT JOIN @WeeklyAvailability wa ON wa.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue)
    ORDER BY 
        dr.DateValue;

    DROP TABLE #DateRange;
END;
GO

-- sp_Provider_CalculatePrice: Dynamic pricing calculation
CREATE PROCEDURE sp_Provider_CalculatePrice
    @ProviderID INT,
    @EventDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @GuestCount INT = NULL,
    @ServiceIDs NVARCHAR(MAX) = NULL, -- JSON array of service IDs
    @PackageID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @BasePrice DECIMAL(18, 2) = 0;
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
    DECLARE @DurationHours DECIMAL(10, 2);
    DECLARE @IsAvailable BIT = 1;
    DECLARE @Message NVARCHAR(255) = '';
    
    -- Calculate duration in hours
    SET @DurationHours = DATEDIFF(MINUTE, @StartTime, @EndTime) / 60.0;
    
    -- Get provider base price
    SELECT @BasePrice = BasePrice 
    FROM ServiceProviders 
    WHERE ProviderID = @ProviderID;
    
    -- Check if provider has pricing tiers for this date
    DECLARE @PriceMultiplier DECIMAL(5, 2) = 1.0;
    
    SELECT @PriceMultiplier = PriceMultiplier
    FROM PricingTiers
    WHERE 
        (ProviderID = @ProviderID OR ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID))
        AND @EventDate BETWEEN StartDate AND EndDate
        AND IsActive = 1
    ORDER BY 
        ProviderID DESC, -- Prefer provider-specific over type-specific
        PriceMultiplier DESC
    OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
    
    SET @BasePrice = @BasePrice * @PriceMultiplier;
    
    -- Check availability
    DECLARE @DayOfWeek TINYINT = DATEPART(WEEKDAY, @EventDate);
    
    -- Check blackout dates
    IF EXISTS (
        SELECT 1 FROM ProviderBlackoutDates 
        WHERE ProviderID = @ProviderID 
        AND @EventDate BETWEEN StartDate AND EndDate
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is not available on this date (blackout).';
    END
    
    -- Check weekly availability
    IF @IsAvailable = 1 AND NOT EXISTS (
        SELECT 1 FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID 
        AND DayOfWeek = @DayOfWeek 
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is not available at the requested time.';
    END
    
    -- Check existing bookings
    IF @IsAvailable = 1 AND EXISTS (
        SELECT 1 FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate = @EventDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        )
    )
    BEGIN
        SET @IsAvailable = 0;
        SET @Message = 'Provider is already booked at the requested time.';
    END
    
    -- Check guest count against provider limits
    DECLARE @MinEventSize INT, @MaxEventSize INT;
    
    SELECT 
        @MinEventSize = MinEventSize,
        @MaxEventSize = MaxEventSize
    FROM ServiceProviders
    WHERE ProviderID = @ProviderID;
    
    IF @GuestCount IS NOT NULL
    BEGIN
        IF @MinEventSize IS NOT NULL AND @GuestCount < @MinEventSize
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Guest count is below provider minimum of ' + CAST(@MinEventSize AS NVARCHAR(10));
        END
        
        IF @MaxEventSize IS NOT NULL AND @GuestCount > @MaxEventSize
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Guest count exceeds provider maximum of ' + CAST(@MaxEventSize AS NVARCHAR(10));
        END
    END
    
    -- Calculate price based on services/packages
    IF @PackageID IS NOT NULL
    BEGIN
        -- Package pricing
        SELECT @TotalPrice = Price
        FROM ProviderServicePackages
        WHERE PackageID = @PackageID AND ProviderID = @ProviderID AND IsActive = 1;
        
        IF @TotalPrice IS NULL
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'Selected package is not available.';
        END
    END
    ELSE IF @ServiceIDs IS NOT NULL
    BEGIN
        -- Individual services pricing
        DECLARE @ServiceTable TABLE (ServiceID INT);
        
        -- Parse JSON array of service IDs
        INSERT INTO @ServiceTable (ServiceID)
        SELECT value FROM OPENJSON(@ServiceIDs);
        
        -- Calculate total price for selected services
        SELECT @TotalPrice = SUM(
            CASE 
                WHEN ps.PriceType = 'hourly' THEN ps.BasePrice * @DurationHours
                WHEN ps.PriceType = 'per person' AND @GuestCount IS NOT NULL THEN ps.BasePrice * @GuestCount
                ELSE ps.BasePrice
            END
        )
        FROM ProviderServices ps
        INNER JOIN @ServiceTable st ON ps.ProviderServiceID = st.ServiceID
        WHERE ps.ProviderID = @ProviderID AND ps.IsActive = 1;
        
        IF @TotalPrice IS NULL
        BEGIN
            SET @IsAvailable = 0;
            SET @Message = 'One or more selected services are not available.';
        END
    END
    ELSE
    BEGIN
        -- Base price only
        SET @TotalPrice = @BasePrice;
    END
    
    -- Apply price multiplier
    SET @TotalPrice = @TotalPrice * @PriceMultiplier;
    
    -- Return results
    SELECT 
        @IsAvailable AS IsAvailable,
        @Message AS Message,
        @BasePrice AS BasePrice,
        @TotalPrice AS TotalPrice,
        @PriceMultiplier AS PriceMultiplier,
        @DurationHours AS DurationHours;
END;
GO

-- sp_Provider_GetReviews: Retrieve provider reviews
CREATE PROCEDURE sp_Provider_GetReviews
    @ProviderID INT,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @MinRating INT = NULL,
    @MaxRating INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Get total count
    DECLARE @TotalCount INT;
    
    SELECT @TotalCount = COUNT(*)
    FROM ProviderReviews
    WHERE ProviderID = @ProviderID
    AND IsApproved = 1
    AND (@MinRating IS NULL OR Rating >= @MinRating)
    AND (@MaxRating IS NULL OR Rating <= @MaxRating);
    
    -- Get paginated reviews
    SELECT 
        pr.ReviewID,
        pr.Rating,
        pr.ReviewText,
        pr.ReviewDate,
        pr.ResponseText,
        pr.ResponseDate,
        u.UserID,
        u.FirstName + ' ' + u.LastName AS ReviewerName,
        u.AvatarURL AS ReviewerAvatar,
        b.EventName,
        b.EventDate,
        @TotalCount AS TotalCount
    FROM 
        ProviderReviews pr
        INNER JOIN Users u ON pr.UserID = u.UserID
        LEFT JOIN Bookings b ON pr.BookingID = b.BookingID
    WHERE 
        pr.ProviderID = @ProviderID
        AND pr.IsApproved = 1
        AND (@MinRating IS NULL OR pr.Rating >= @MinRating)
        AND (@MaxRating IS NULL OR pr.Rating <= @MaxRating)
    ORDER BY 
        pr.ReviewDate DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Get average rating
    SELECT 
        AVG(CAST(Rating AS DECIMAL(5,2))) AS AverageRating,
        COUNT(*) AS ReviewCount
    FROM 
        ProviderReviews
    WHERE 
        ProviderID = @ProviderID
        AND IsApproved = 1;
    
    -- Get rating distribution
    SELECT 
        Rating,
        COUNT(*) AS Count
    FROM 
        ProviderReviews
    WHERE 
        ProviderID = @ProviderID
        AND IsApproved = 1
    GROUP BY 
        Rating
    ORDER BY 
        Rating DESC;
    
    -- Get detailed category ratings if available
    IF EXISTS (
        SELECT 1 FROM ReviewCategories rc 
        INNER JOIN ServiceProviders sp ON rc.ProviderTypeID = sp.TypeID
        WHERE sp.ProviderID = @ProviderID
    )
    BEGIN
        SELECT 
            rc.CategoryID,
            rc.CategoryName,
            rc.Description,
            AVG(CAST(rcr.Rating AS DECIMAL(5,2))) AS AverageRating,
            COUNT(rcr.RatingID) AS RatingCount
        FROM 
            ReviewCategories rc
            LEFT JOIN ReviewCategoryRatings rcr ON rc.CategoryID = rcr.CategoryID
            LEFT JOIN ProviderReviews pr ON rcr.ReviewID = pr.ReviewID AND pr.ProviderID = @ProviderID
        WHERE 
            rc.ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID)
        GROUP BY 
            rc.CategoryID, rc.CategoryName, rc.Description
        ORDER BY 
            rc.CategoryName;
    END
END;
GO
