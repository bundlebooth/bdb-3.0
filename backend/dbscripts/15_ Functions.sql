-- Section 15: Functions

-- Calculate distance between two points (in miles)
CREATE FUNCTION fn_CalculateDistanceMiles
(
    @Lat1 DECIMAL(10, 8),
    @Lon1 DECIMAL(11, 8),
    @Lat2 DECIMAL(10, 8),
    @Lon2 DECIMAL(11, 8)
)
RETURNS FLOAT
AS
BEGIN
    DECLARE @EarthRadius FLOAT = 3958.8; -- miles
    DECLARE @dLat FLOAT = RADIANS(@Lat2 - @Lat1);
    DECLARE @dLon FLOAT = RADIANS(@Lon2 - @Lon1);
    DECLARE @a FLOAT = SIN(@dLat / 2) * SIN(@dLat / 2) + 
                      COS(RADIANS(@Lat1)) * COS(RADIANS(@Lat2)) * 
                      SIN(@dLon / 2) * SIN(@dLon / 2);
    DECLARE @c FLOAT = 2 * ATN2(SQRT(@a), SQRT(1 - @a));
    DECLARE @Distance FLOAT = @EarthRadius * @c;
    RETURN @Distance;
END;
GO

-- Check if a date is within a provider's availability
CREATE FUNCTION fn_IsProviderAvailable
(
    @ProviderID INT,
    @Date DATE,
    @StartTime TIME,
    @EndTime TIME
)
RETURNS BIT
AS
BEGIN
    DECLARE @IsAvailable BIT = 0;
    
    -- Check blackout dates first
    IF EXISTS (
        SELECT 1 FROM ProviderBlackoutDates 
        WHERE ProviderID = @ProviderID 
        AND @Date BETWEEN StartDate AND EndDate
    )
    BEGIN
        RETURN 0;
    END
    
    -- Check existing bookings
    IF EXISTS (
        SELECT 1 FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate = @Date
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        )
    )
    BEGIN
        RETURN 0;
    END
    
    -- Check weekly availability
    DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @Date);
    IF EXISTS (
        SELECT 1 FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID
        AND DayOfWeek = @DayOfWeek
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SET @IsAvailable = 1;
    END
    
    RETURN @IsAvailable;
END;
GO

-- Calculate booking price with dynamic pricing
CREATE FUNCTION fn_CalculateBookingPrice
(
    @ProviderID INT,
    @EventDate DATE,
    @BasePrice DECIMAL(18, 2),
    @ServiceIDs NVARCHAR(MAX) = NULL, -- JSON array of service IDs
    @PackageID INT = NULL
)
RETURNS DECIMAL(18, 2)
AS
BEGIN
    DECLARE @TotalPrice DECIMAL(18, 2) = 0;
    DECLARE @PriceMultiplier DECIMAL(5, 2) = 1.0;
    
    -- Check for pricing tiers
    SELECT @PriceMultiplier = PriceMultiplier
    FROM PricingTiers
    WHERE 
        (ProviderID = @ProviderID OR ProviderTypeID = (SELECT TypeID FROM ServiceProviders WHERE ProviderID = @ProviderID))
        AND @EventDate BETWEEN StartDate AND EndDate
        AND IsActive = 1
    ORDER BY 
        ProviderID DESC -- Prefer provider-specific over type-specific
    OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
    
    -- Calculate price based on services/packages
    IF @PackageID IS NOT NULL
    BEGIN
        -- Package pricing
        SELECT @TotalPrice = Price
        FROM ProviderServicePackages
        WHERE PackageID = @PackageID AND ProviderID = @ProviderID AND IsActive = 1;
    END
    ELSE IF @ServiceIDs IS NOT NULL
    BEGIN
        -- Individual services pricing
        SELECT @TotalPrice = SUM(BasePrice)
        FROM ProviderServices
        WHERE ProviderServiceID IN (SELECT value FROM OPENJSON(@ServiceIDs))
        AND ProviderID = @ProviderID AND IsActive = 1;
    END
    ELSE
    BEGIN
        -- Base price only
        SET @TotalPrice = @BasePrice;
    END
    
    -- Apply price multiplier
    SET @TotalPrice = @TotalPrice * @PriceMultiplier;
    RETURN @TotalPrice;
END;
GO
