-- Enhanced VenueVue Database Schema - Version 2
-- Includes all functionality from the frontend

-- ======================
-- TABLES (Updates and Additions)
-- ======================

-- Add location fields to VendorProfiles
ALTER TABLE VendorProfiles
ADD 
    Address NVARCHAR(255),
    City NVARCHAR(100),
    State NVARCHAR(50),
    Country NVARCHAR(50) DEFAULT 'USA',
    PostalCode NVARCHAR(20),
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    IsPremium BIT DEFAULT 0,
    IsEcoFriendly BIT DEFAULT 0,
    IsAwardWinning BIT DEFAULT 0,
    PriceLevel NVARCHAR(10) DEFAULT '$$',
    Capacity INT,
    Rooms INT,
    FeaturedImageURL NVARCHAR(255);
GO

-- Create vendor images table
CREATE TABLE VendorImages (
    ImageID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ImageURL NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    Caption NVARCHAR(255)
);
GO

-- Create vendor availability exceptions
CREATE TABLE VendorAvailabilityExceptions (
    ExceptionID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    StartTime TIME,
    EndTime TIME,
    IsAvailable BIT DEFAULT 1,
    Reason NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Create time slots table
CREATE TABLE TimeSlots (
    SlotID INT PRIMARY KEY IDENTITY(1,1),
    VendorProfileID INT FOREIGN KEY REFERENCES VendorProfiles(VendorProfileID),
    ServiceID INT FOREIGN KEY REFERENCES Services(ServiceID),
    DayOfWeek TINYINT CHECK (DayOfWeek BETWEEN 0 AND 6), -- 0=Sunday, NULL for specific dates
    Date DATE, -- Specific date if not recurring
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    MaxCapacity INT,
    IsAvailable BIT DEFAULT 1,
    CONSTRAINT CHK_DayOrDate CHECK ((DayOfWeek IS NOT NULL AND Date IS NULL) OR (DayOfWeek IS NULL AND Date IS NOT NULL))
);
GO

-- Create user location history
CREATE TABLE UserLocations (
    LocationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Latitude DECIMAL(10, 8) NOT NULL,
    Longitude DECIMAL(11, 8) NOT NULL,
    City NVARCHAR(100),
    State NVARCHAR(50),
    Country NVARCHAR(50),
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

-- Create search history
CREATE TABLE SearchHistory (
    SearchID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    SearchTerm NVARCHAR(255),
    Category NVARCHAR(50),
    Location NVARCHAR(255),
    Filters NVARCHAR(MAX), -- JSON string of filters used
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

-- Create user sessions
CREATE TABLE UserSessions (
    SessionID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Token NVARCHAR(255) NOT NULL,
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    CreatedAt DATETIME DEFAULT GETDATE(),
    ExpiresAt DATETIME NOT NULL,
    IsActive BIT DEFAULT 1
);
GO

-- ======================
-- UPDATED VIEWS
-- ======================

-- Update vendor details view with new fields
ALTER VIEW vw_VendorDetails AS
SELECT 
    v.VendorProfileID,
    v.UserID,
    u.Name AS OwnerName,
    u.Email AS OwnerEmail,
    u.Phone AS OwnerPhone,
    v.BusinessName,
    v.BusinessDescription,
    v.BusinessPhone,
    v.BusinessEmail,
    v.Website,
    v.YearsInBusiness,
    v.LicenseNumber,
    v.InsuranceVerified,
    v.IsVerified,
    v.AverageResponseTime,
    v.ResponseRate,
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
    v.PriceLevel,
    v.Capacity,
    v.Rooms,
    v.FeaturedImageURL,
    (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS PrimaryImage
FROM VendorProfiles v
JOIN Users u ON v.UserID = u.UserID
WHERE u.IsActive = 1;
GO

-- Create view for vendor search results
CREATE VIEW vw_VendorSearchResults AS
SELECT 
    v.VendorProfileID AS id,
    v.BusinessName AS name,
    CONCAT(v.City, ', ', v.State) AS location,
    (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
    v.PriceLevel,
    (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
     JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
     WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
    CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
    ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
    v.BusinessDescription AS description,
    ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
    CASE 
        WHEN v.IsPremium = 1 THEN 'Premium'
        WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
        ELSE NULL
    END AS badge,
    v.Capacity,
    v.Rooms,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.Latitude,
    v.Longitude,
    JSON_QUERY((
        SELECT 
            sc.Name AS category,
            JSON_QUERY((
                SELECT 
                    s.ServiceID,
                    s.Name AS name,
                    s.Description AS description,
                    '$' + CAST(s.Price AS NVARCHAR(20)) + 
                    CASE WHEN s.DurationMinutes IS NOT NULL 
                         THEN ' for ' + CAST(s.DurationMinutes/60 AS NVARCHAR(10)) + ' hours'
                         ELSE '' END AS price,
                    s.DurationMinutes,
                    s.MaxAttendees
                FROM Services s
                WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                FOR JSON PATH
            )) AS services
        FROM ServiceCategories sc
        WHERE sc.VendorProfileID = v.VendorProfileID
        FOR JSON PATH
    )) AS services
FROM VendorProfiles v
WHERE v.IsVerified = 1;
GO

-- ======================
-- UPDATED STORED PROCEDURES
-- ======================

-- Enhanced vendor search procedure with location filtering
CREATE OR ALTER PROCEDURE sp_SearchVendors
    @SearchTerm NVARCHAR(100) = NULL,
    @Category NVARCHAR(50) = NULL,
    @MinPrice DECIMAL(10, 2) = NULL,
    @MaxPrice DECIMAL(10, 2) = NULL,
    @IsPremium BIT = NULL,
    @IsEcoFriendly BIT = NULL,
    @IsAwardWinning BIT = NULL,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @RadiusMiles INT = 25,
    @PageNumber INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = 'recommended'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate distance if location provided
    DECLARE @DistanceCalculation NVARCHAR(MAX) = '';
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @DistanceCalculation = ', 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * 
            COS(RADIANS(v.Latitude)) * 
            COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20)) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20)) + ')) * 
            SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles';
    END
    
    -- Build dynamic SQL for sorting
    DECLARE @SortExpression NVARCHAR(100);
    SET @SortExpression = CASE @SortBy
        WHEN 'price-low' THEN 'MinPrice ASC'
        WHEN 'price-high' THEN 'MinPrice DESC'
        WHEN 'rating' THEN 'AverageRating DESC'
        WHEN 'popular' THEN 'FavoriteCount DESC'
        WHEN 'nearest' THEN 'DistanceMiles ASC'
        ELSE 'v.BusinessName ASC' -- Default/recommended
    END;
    
    -- Build the full query
    DECLARE @SQL NVARCHAR(MAX) = '
    WITH FilteredVendors AS (
        SELECT 
            v.VendorProfileID,
            v.BusinessName,
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
            (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS ImageURL,
            (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
            (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
            (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
            (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) AS MinPrice'
            + @DistanceCalculation + '
        FROM VendorProfiles v
        JOIN Users u ON v.UserID = u.UserID
        WHERE u.IsActive = 1
        AND v.IsVerified = 1
        AND (@SearchTerm IS NULL OR v.BusinessName LIKE ''%'' + @SearchTerm + ''%'' OR v.BusinessDescription LIKE ''%'' + @SearchTerm + ''%'')
        AND (@Category IS NULL OR EXISTS (SELECT 1 FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID AND vc.Category = @Category))
        AND (@IsPremium IS NULL OR v.IsPremium = @IsPremium)
        AND (@IsEcoFriendly IS NULL OR v.IsEcoFriendly = @IsEcoFriendly)
        AND (@IsAwardWinning IS NULL OR v.IsAwardWinning = @IsAwardWinning)
        AND (@MinPrice IS NULL OR (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) >= @MinPrice)
        AND (@MaxPrice IS NULL OR (SELECT MIN(s.Price) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = v.VendorProfileID) <= @MaxPrice)'
    
    -- Add distance filter if location provided
    IF @Latitude IS NOT NULL AND @Longitude IS NOT NULL
    BEGIN
        SET @SQL = @SQL + '
        AND v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
        AND 3959 * ACOS(
            COS(RADIANS(' + CAST(@Latitude AS NVARCHAR(20) + ')) * 
            COS(RADIANS(v.Latitude)) * 
            COS(RADIANS(v.Longitude) - RADIANS(' + CAST(@Longitude AS NVARCHAR(20) + ')) + 
            SIN(RADIANS(' + CAST(@Latitude AS NVARCHAR(20) + ')) * 
            SIN(RADIANS(v.Latitude))
        ) <= @RadiusMiles'
    END
    
    -- Complete the query with pagination
    SET @SQL = @SQL + '
    )
    SELECT 
        VendorProfileID AS id,
        BusinessName AS name,
        CONCAT(City, '', '', State) AS location,
        (SELECT TOP 1 Category FROM VendorCategories vc WHERE vc.VendorProfileID = FilteredVendors.VendorProfileID) AS category,
        PriceLevel AS priceLevel,
        ''$'' + CAST(MinPrice AS NVARCHAR(20)) AS price,
        CAST(AverageRating AS NVARCHAR(10)) + '' ('' + CAST(ReviewCount AS NVARCHAR(10)) + '')'' AS rating,
        BusinessDescription AS description,
        ImageURL AS image,
        CASE 
            WHEN IsPremium = 1 THEN ''Premium''
            WHEN FavoriteCount > 20 THEN ''Popular''
            ELSE NULL
        END AS badge,
        Capacity,
        Rooms,
        IsPremium,
        IsEcoFriendly,
        IsAwardWinning,
        (SELECT COUNT(*) FROM FilteredVendors) AS TotalCount
    FROM FilteredVendors
    ORDER BY ' + @SortExpression + '
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY'
    
    -- Execute the dynamic SQL
    EXEC sp_executesql @SQL, 
        N'@SearchTerm NVARCHAR(100), @Category NVARCHAR(50), @MinPrice DECIMAL(10, 2), @MaxPrice DECIMAL(10, 2), 
          @IsPremium BIT, @IsEcoFriendly BIT, @IsAwardWinning BIT, @Latitude DECIMAL(10, 8), @Longitude DECIMAL(11, 8), 
          @RadiusMiles INT, @PageNumber INT, @PageSize INT',
        @SearchTerm, @Category, @MinPrice, @MaxPrice, @IsPremium, @IsEcoFriendly, @IsAwardWinning, 
        @Latitude, @Longitude, @RadiusMiles, @PageNumber, @PageSize
END;
GO

-- Enhanced get vendor details procedure
CREATE OR ALTER PROCEDURE sp_GetVendorDetails
    @VendorProfileID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor profile
    SELECT * FROM vw_VendorDetails WHERE VendorProfileID = @VendorProfileID;
    
    -- Vendor categories
    SELECT Category FROM VendorCategories WHERE VendorProfileID = @VendorProfileID ORDER BY Category;
    
    -- Vendor services with categories
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MinDuration,
        s.MaxAttendees,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.CancellationPolicy
    FROM ServiceCategories sc
    JOIN Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND s.IsActive = 1
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
    
    -- Service add-ons
    SELECT 
        sa.AddOnID,
        sa.ServiceID,
        sa.Name,
        sa.Description,
        sa.Price
    FROM ServiceAddOns sa
    JOIN Services s ON sa.ServiceID = s.ServiceID
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND sa.IsActive = 1
    ORDER BY sa.ServiceID, sa.Name;
    
    -- Vendor portfolio
    SELECT * FROM VendorPortfolio WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor reviews
    SELECT * FROM vw_VendorReviews WHERE VendorProfileID = @VendorProfileID ORDER BY IsFeatured DESC, CreatedAt DESC;
    
    -- Vendor FAQs
    SELECT * FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor team
    SELECT * FROM VendorTeam WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor social media
    SELECT * FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Vendor business hours
    SELECT * FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID ORDER BY DayOfWeek;
    
    -- Vendor images
    SELECT * FROM VendorImages WHERE VendorProfileID = @VendorProfileID ORDER BY IsPrimary DESC, DisplayOrder;
    
    -- Is favorite for current user
    IF @UserID IS NOT NULL
    BEGIN
        SELECT CAST(CASE WHEN EXISTS (
            SELECT 1 FROM Favorites 
            WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ) THEN 1 ELSE 0 END AS BIT) AS IsFavorite;
    END
    
    -- Available time slots for next 30 days
    SELECT 
        ts.SlotID,
        ts.ServiceID,
        ts.DayOfWeek,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        (SELECT COUNT(*) FROM Bookings b 
         WHERE b.ServiceID = ts.ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND CONVERT(DATE, b.EventDate) = ISNULL(ts.Date, DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) + ts.DayOfWeek)
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime) AS BookedCount
    FROM TimeSlots ts
    JOIN Services s ON ts.ServiceID = s.ServiceID
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL AND ts.DayOfWeek IS NOT NULL) OR -- Recurring weekly slots
        (ts.Date IS NOT NULL AND ts.Date BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE())) -- Specific date slots
    )
    ORDER BY ISNULL(ts.Date, DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) + ts.DayOfWeek)), ts.StartTime;
END;
GO

-- Get service availability with time slots
CREATE OR ALTER PROCEDURE sp_GetServiceAvailability
    @ServiceID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get service details
    SELECT 
        s.ServiceID,
        s.Name,
        s.DurationMinutes,
        sc.Name AS CategoryName,
        vp.BusinessName AS VendorName,
        vp.VendorProfileID
    FROM Services s
    JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    JOIN VendorProfiles vp ON sc.VendorProfileID = vp.VendorProfileID
    WHERE s.ServiceID = @ServiceID;
    
    -- Get standard business hours
    SELECT 
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable
    FROM VendorBusinessHours
    WHERE VendorProfileID = (
        SELECT sc.VendorProfileID 
        FROM Services s
        JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID
    )
    ORDER BY DayOfWeek;
    
    -- Get availability exceptions
    SELECT 
        StartDateTime,
        EndDateTime,
        IsAvailable,
        Reason
    FROM ServiceAvailability
    WHERE ServiceID = @ServiceID
    AND (
        (StartDateTime >= @StartDate AND StartDateTime <= @EndDate) OR
        (EndDateTime >= @StartDate AND EndDateTime <= @EndDate) OR
        (StartDateTime <= @StartDate AND EndDateTime >= @EndDate)
    )
    ORDER BY StartDateTime;
    
    -- Get existing bookings
    SELECT 
        EventDate,
        EndDate,
        Status
    FROM Bookings
    WHERE ServiceID = @ServiceID
    AND Status NOT IN ('cancelled', 'rejected')
    AND (
        (EventDate >= @StartDate AND EventDate <= @EndDate) OR
        (EndDate >= @StartDate AND EndDate <= @EndDate) OR
        (EventDate <= @StartDate AND EndDate >= @EndDate)
    )
    ORDER BY EventDate;
    
    -- Get available time slots
    SELECT 
        ts.SlotID,
        ts.DayOfWeek,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        (SELECT COUNT(*) FROM Bookings b 
         WHERE b.ServiceID = @ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND CONVERT(DATE, b.EventDate) = ISNULL(ts.Date, DATEADD(DAY, DATEDIFF(DAY, 0, @StartDate) + ts.DayOfWeek)
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime) AS BookedCount
    FROM TimeSlots ts
    WHERE ts.ServiceID = @ServiceID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL AND ts.DayOfWeek IS NOT NULL) OR -- Recurring weekly slots
        (ts.Date IS NOT NULL AND ts.Date BETWEEN @StartDate AND @EndDate) -- Specific date slots
    )
    ORDER BY ISNULL(ts.Date, DATEADD(DAY, DATEDIFF(DAY, 0, @StartDate) + ts.DayOfWeek)), ts.StartTime;
END;
GO

-- Toggle favorite status
CREATE OR ALTER PROCEDURE sp_ToggleFavorite
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @IsFavorite BIT;
        
        -- Check if already favorite
        IF EXISTS (SELECT 1 FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
        BEGIN
            -- Remove favorite
            DELETE FROM Favorites 
            WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
            
            SET @IsFavorite = 0;
        END
        ELSE
        BEGIN
            -- Add favorite
            INSERT INTO Favorites (UserID, VendorProfileID)
            VALUES (@UserID, @VendorProfileID);
            
            SET @IsFavorite = 1;
        END
        
        -- Update favorite count
        DECLARE @FavoriteCount INT = (SELECT COUNT(*) FROM Favorites WHERE VendorProfileID = @VendorProfileID);
        
        COMMIT TRANSACTION;
        
        SELECT @IsFavorite AS IsFavorite, @FavoriteCount AS FavoriteCount;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get user favorites
CREATE OR ALTER PROCEDURE sp_GetUserFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        v.VendorProfileID AS id,
        v.BusinessName AS name,
        CONCAT(v.City, ', ', v.State) AS location,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
        v.PriceLevel,
        (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
        CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
        ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
        v.BusinessDescription AS description,
        ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
        CASE 
            WHEN v.IsPremium = 1 THEN 'Premium'
            WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
            ELSE NULL
        END AS badge,
        v.Capacity,
        v.Rooms,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning
    FROM Favorites f
    JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID
    WHERE f.UserID = @UserID
    ORDER BY f.CreatedAt DESC;
END;
GO

-- Create booking with multiple services
CREATE OR ALTER PROCEDURE sp_CreateBookingWithServices
    @UserID INT,
    @VendorProfileID INT,
    @EventDate DATETIME,
    @EndDate DATETIME,
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @PaymentIntentID NVARCHAR(100) = NULL,
    @ServicesJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TotalAmount DECIMAL(10, 2) = 0;
        DECLARE @DepositAmount DECIMAL(10, 2) = 0;
        DECLARE @MaxDepositPercentage DECIMAL(5, 2) = 0;
        
        -- Parse services JSON
        DECLARE @Services TABLE (
            ServiceID INT,
            AddOnID INT NULL,
            Quantity INT,
            Price DECIMAL(10, 2),
            DepositPercentage DECIMAL(5, 2)
        );
        
        INSERT INTO @Services
        SELECT 
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            DepositPercentage
        FROM OPENJSON(@ServicesJSON)
        WITH (
            ServiceID INT '$.serviceId',
            AddOnID INT '$.addOnId',
            Quantity INT '$.quantity',
            Price DECIMAL(10, 2) '$.price',
            DepositPercentage DECIMAL(5, 2) '$.depositPercentage'
        );
        
        -- Calculate totals
        SELECT 
            @TotalAmount = SUM(Price * Quantity),
            @MaxDepositPercentage = MAX(DepositPercentage)
        FROM @Services;
        
        SET @DepositAmount = @TotalAmount * (@MaxDepositPercentage / 100);
        
        -- Create booking
        INSERT INTO Bookings (
            UserID,
            VendorProfileID,
            EventDate,
            EndDate,
            Status,
            TotalAmount,
            DepositAmount,
            AttendeeCount,
            SpecialRequests,
            StripePaymentIntentID
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @EventDate,
            @EndDate,
            'pending',
            @TotalAmount,
            @DepositAmount,
            @AttendeeCount,
            @SpecialRequests,
            @PaymentIntentID
        );
        
        DECLARE @BookingID INT = SCOPE_IDENTITY();
        
        -- Add booking services
        INSERT INTO BookingServices (
            BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            PriceAtBooking,
            Notes
        )
        SELECT 
            @BookingID,
            ServiceID,
            AddOnID,
            Quantity,
            Price,
            'Booked via website'
        FROM @Services;
        
        -- Create booking timeline entry
        INSERT INTO BookingTimeline (
            BookingID,
            Status,
            ChangedBy,
            Notes
        )
        VALUES (
            @BookingID,
            'pending',
            @UserID,
            'Booking created by customer'
        );
        
        -- Create conversation
        DECLARE @ConversationID INT;
        
        INSERT INTO Conversations (
            UserID,
            VendorProfileID,
            BookingID,
            Subject,
            LastMessageAt
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            'Booking #' + CAST(@BookingID AS NVARCHAR(10)),
            GETDATE()
        );
        
        SET @ConversationID = SCOPE_IDENTITY();
        
        -- Create initial message
        INSERT INTO Messages (
            ConversationID,
            SenderID,
            Content
        )
        VALUES (
            @ConversationID,
            @UserID,
            'I have booked services for ' + CONVERT(NVARCHAR(20), @EventDate, 107) + '. ' + 
            ISNULL(@SpecialRequests, 'No special requests.')
        );
        
        -- Create notification for vendor
        INSERT INTO Notifications (
            UserID,
            Type,
            Title,
            Message,
            RelatedID,
            RelatedType,
            ActionURL
        )
        VALUES (
            (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
            'booking',
            'New Booking Request',
            'You have a new booking request for ' + CONVERT(NVARCHAR(20), @EventDate, 107),
            @BookingID,
            'booking',
            '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
        );
        
        COMMIT TRANSACTION;
        
        SELECT @BookingID AS BookingID, @ConversationID AS ConversationID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get booking details
CREATE OR ALTER PROCEDURE sp_GetBookingDetails
    @BookingID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Booking info
    SELECT 
        b.BookingID,
        b.UserID,
        u.Name AS UserName,
        u.Email AS UserEmail,
        u.Phone AS UserPhone,
        b.VendorProfileID,
        v.BusinessName AS VendorName,
        v.BusinessEmail AS VendorEmail,
        v.BusinessPhone AS VendorPhone,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.StripePaymentIntentID,
        b.CreatedAt,
        b.UpdatedAt,
        CASE 
            WHEN b.UserID = @UserID THEN 1
            WHEN v.UserID = @UserID THEN 1
            ELSE 0
        END AS CanViewDetails
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    JOIN VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    WHERE b.BookingID = @BookingID
    AND (@UserID IS NULL OR b.UserID = @UserID OR v.UserID = @UserID);
    
    -- Booking services
    SELECT 
        bs.BookingServiceID,
        bs.ServiceID,
        s.Name AS ServiceName,
        bs.AddOnID,
        sa.Name AS AddOnName,
        bs.Quantity,
        bs.PriceAtBooking,
        bs.Notes,
        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
    WHERE bs.BookingID = @BookingID;
    
    -- Booking timeline
    SELECT 
        bt.TimelineID,
        bt.Status,
        bt.ChangedBy,
        u.Name AS ChangedByName,
        bt.Notes,
        bt.CreatedAt
    FROM BookingTimeline bt
    LEFT JOIN Users u ON bt.ChangedBy = u.UserID
    WHERE bt.BookingID = @BookingID
    ORDER BY bt.CreatedAt DESC;
    
    -- Conversation info if exists
    SELECT TOP 1
        c.ConversationID
    FROM Conversations c
    WHERE c.BookingID = @BookingID;
END;
GO

-- Get conversation messages
CREATE OR ALTER PROCEDURE sp_GetConversationMessages
    @ConversationID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify user has access to conversation
    IF EXISTS (
        SELECT 1 FROM Conversations c
        WHERE c.ConversationID = @ConversationID
        AND (c.UserID = @UserID OR 
             (SELECT v.UserID FROM VendorProfiles v WHERE v.VendorProfileID = c.VendorProfileID) = @UserID)
    )
    BEGIN
        -- Get messages
        SELECT 
            m.MessageID,
            m.SenderID,
            u.Name AS SenderName,
            u.Avatar AS SenderAvatar,
            m.Content,
            m.IsRead,
            m.ReadAt,
            m.CreatedAt,
            (
                SELECT 
                    ma.AttachmentID,
                    ma.FileURL,
                    ma.FileType,
                    ma.FileSize,
                    ma.OriginalName
                FROM MessageAttachments ma
                WHERE ma.MessageID = m.MessageID
                FOR JSON PATH
            ) AS Attachments
        FROM Messages m
        JOIN Users u ON m.SenderID = u.UserID
        WHERE m.ConversationID = @ConversationID
        ORDER BY m.CreatedAt;
        
        -- Mark messages as read if recipient
        UPDATE m
        SET m.IsRead = 1,
            m.ReadAt = GETDATE()
        FROM Messages m
        JOIN Conversations c ON m.ConversationID = c.ConversationID
        WHERE m.ConversationID = @ConversationID
        AND m.SenderID != @UserID
        AND m.IsRead = 0;
    END
    ELSE
    BEGIN
        -- Return empty result if no access
        SELECT TOP 0 NULL AS MessageID;
    END
END;
GO

-- Get user notifications
CREATE OR ALTER PROCEDURE sp_GetUserNotifications
    @UserID INT,
    @UnreadOnly BIT = 0,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        n.NotificationID,
        n.Type,
        n.Title,
        n.Message,
        n.IsRead,
        n.ReadAt,
        n.RelatedID,
        n.RelatedType,
        n.ActionURL,
        n.CreatedAt,
        CASE 
            WHEN n.Type = 'booking' THEN (SELECT b.Status FROM Bookings b WHERE b.BookingID = n.RelatedID)
            ELSE NULL
        END AS Status
    FROM Notifications n
    WHERE n.UserID = @UserID
    AND (@UnreadOnly = 0 OR n.IsRead = 0)
    ORDER BY n.CreatedAt DESC;
    
    -- Mark as read if fetching unread
    IF @UnreadOnly = 1
    BEGIN
        UPDATE Notifications
        SET IsRead = 1,
            ReadAt = GETDATE()
        WHERE UserID = @UserID
        AND IsRead = 0;
    END
END;
GO

-- ======================
-- NEW STORED PROCEDURES
-- ======================

-- Create or update user location
CREATE OR ALTER PROCEDURE sp_UpdateUserLocation
    @UserID INT,
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO UserLocations (
        UserID,
        Latitude,
        Longitude,
        City,
        State,
        Country
    )
    VALUES (
        @UserID,
        @Latitude,
        @Longitude,
        @City,
        @State,
        @Country
    );
    
    SELECT SCOPE_IDENTITY() AS LocationID;
END;
GO

-- Get nearby vendors
CREATE OR ALTER PROCEDURE sp_GetNearbyVendors
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @RadiusMiles INT = 25,
    @Category NVARCHAR(50) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        v.VendorProfileID AS id,
        v.BusinessName AS name,
        CONCAT(v.City, ', ', v.State) AS location,
        (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
        v.PriceLevel,
        (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
        CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
        ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
        v.BusinessDescription AS description,
        ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
        CASE 
            WHEN v.IsPremium = 1 THEN 'Premium'
            WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
            ELSE NULL
        END AS badge,
        3959 * ACOS(
            COS(RADIANS(@Latitude)) * 
            COS(RADIANS(v.Latitude)) * 
            COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
            SIN(RADIANS(@Latitude)) * 
            SIN(RADIANS(v.Latitude))
        ) AS DistanceMiles
    FROM VendorProfiles v
    WHERE v.Latitude IS NOT NULL AND v.Longitude IS NOT NULL
    AND 3959 * ACOS(
        COS(RADIANS(@Latitude)) * 
        COS(RADIANS(v.Latitude)) * 
        COS(RADIANS(v.Longitude) - RADIANS(@Longitude)) + 
        SIN(RADIANS(@Latitude)) * 
        SIN(RADIANS(v.Latitude))
    ) <= @RadiusMiles
    AND (@Category IS NULL OR EXISTS (
        SELECT 1 FROM VendorCategories vc 
        WHERE vc.VendorProfileID = v.VendorProfileID 
        AND vc.Category = @Category
    ))
    ORDER BY DistanceMiles;
END;
GO

-- Create payment intent for booking
CREATE OR ALTER PROCEDURE sp_CreateBookingPaymentIntent
    @BookingID INT,
    @Amount DECIMAL(10, 2),
    @Currency NVARCHAR(3) = 'USD',
    @PaymentMethodID NVARCHAR(100) = NULL,
    @CustomerID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PaymentIntentID NVARCHAR(100) = 'pi_' + LEFT(NEWID(), 8) + '_' + LEFT(NEWID(), 8);
    DECLARE @ClientSecret NVARCHAR(100) = 'secret_' + LEFT(NEWID(), 24);
    
    -- In a real implementation, this would call Stripe API to create a payment intent
    -- This is a simplified version for demo purposes
    
    -- Update booking with payment intent
    UPDATE Bookings
    SET StripePaymentIntentID = @PaymentIntentID
    WHERE BookingID = @BookingID;
    
    SELECT 
        @PaymentIntentID AS PaymentIntentID,
        @ClientSecret AS ClientSecret;
END;
GO

-- Confirm booking payment
CREATE OR ALTER PROCEDURE sp_ConfirmBookingPayment
    @BookingID INT,
    @PaymentIntentID NVARCHAR(100),
    @Amount DECIMAL(10, 2),
    @FeeAmount DECIMAL(10, 2) = 0,
    @ChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking payment status
        DECLARE @IsDeposit BIT = CASE 
            WHEN @Amount < (SELECT TotalAmount FROM Bookings WHERE BookingID = @BookingID) 
            THEN 1 ELSE 0 END;
        
        IF @IsDeposit = 1
        BEGIN
            UPDATE Bookings
            SET DepositPaid = 1
            WHERE BookingID = @BookingID;
        END
        ELSE
        BEGIN
            UPDATE Bookings
            SET FullAmountPaid = 1
            WHERE BookingID = @BookingID;
        END
        
        -- Record transaction
        DECLARE @UserID INT = (SELECT UserID FROM Bookings WHERE BookingID = @BookingID);
        DECLARE @VendorProfileID INT = (SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID);
        
        INSERT INTO Transactions (
            UserID,
            VendorProfileID,
            BookingID,
            Amount,
            FeeAmount,
            NetAmount,
            Currency,
            Description,
            StripeChargeID,
            Status
        )
        VALUES (
            @UserID,
            @VendorProfileID,
            @BookingID,
            @Amount,
            @FeeAmount,
            @Amount - @FeeAmount,
            'USD',
            CASE WHEN @IsDeposit = 1 THEN 'Deposit payment' ELSE 'Full payment' END,
            @ChargeID,
            'succeeded'
        );
        
        -- Create notification
        IF @IsDeposit = 1
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Deposit Received',
                'A deposit payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        ELSE
        BEGIN
            INSERT INTO Notifications (
                UserID,
                Type,
                Title,
                Message,
                RelatedID,
                RelatedType,
                ActionURL
            )
            VALUES (
                (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID),
                'payment',
                'Payment Received',
                'Full payment has been received for booking #' + CAST(@BookingID AS NVARCHAR(10)),
                @BookingID,
                'booking',
                '/vendor/bookings/' + CAST(@BookingID AS NVARCHAR(10))
            );
        END
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get vendor dashboard analytics
CREATE OR ALTER PROCEDURE sp_GetVendorAnalytics
    @VendorProfileID INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Set default date range (last 30 days)
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    -- Booking stats
    SELECT 
        COUNT(*) AS TotalBookings,
        SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) AS CompletedBookings,
        SUM(CASE WHEN Status = 'confirmed' THEN 1 ELSE 0 END) AS ConfirmedBookings,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingBookings,
        SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledBookings,
        SUM(TotalAmount) AS TotalRevenue,
        AVG(TotalAmount) AS AverageBookingValue
    FROM Bookings
    WHERE VendorProfileID = @VendorProfileID
    AND EventDate BETWEEN @StartDate AND @EndDate;
    
    -- Revenue by service
    SELECT 
        s.Name AS ServiceName,
        COUNT(*) AS BookingCount,
        SUM(bs.PriceAtBooking * bs.Quantity) AS TotalRevenue
    FROM Bookings b
    JOIN BookingServices bs ON b.BookingID = bs.BookingID
    JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE b.VendorProfileID = @VendorProfileID
    AND b.EventDate BETWEEN @StartDate AND @EndDate
    GROUP BY s.Name
    ORDER BY TotalRevenue DESC;
    
    -- Revenue by month
    SELECT 
        YEAR(EventDate) AS Year,
        MONTH(EventDate) AS Month,
        COUNT(*) AS BookingCount,
        SUM(TotalAmount) AS TotalRevenue
    FROM Bookings
    WHERE VendorProfileID = @VendorProfileID
    AND EventDate BETWEEN @StartDate AND @EndDate
    GROUP BY YEAR(EventDate), MONTH(EventDate)
    ORDER BY Year, Month;
    
    -- Review stats
    SELECT 
        AVG(CAST(Rating AS DECIMAL(3,1))) AS AverageRating,
        COUNT(*) AS ReviewCount,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) AS FiveStarReviews,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) AS FourStarReviews,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) AS ThreeStarReviews,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) AS TwoStarReviews,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) AS OneStarReviews
    FROM Reviews
    WHERE VendorProfileID = @VendorProfileID
    AND CreatedAt BETWEEN @StartDate AND @EndDate;
END;
GO
