-- Section 14: Stored Procedures - Calendar

-- sp_Calendar_GetAvailability: Get provider availability
CREATE PROCEDURE sp_Calendar_GetAvailability
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
GO
    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Create temp table for dates
    CREATE TABLE #DateRange (
        DateValue DATE
    );
GO
    -- Populate date range
    DECLARE @CurrentDate DATE = @StartDate;
GO
    WHILE @CurrentDate <= @EndDate
    BEGIN
        INSERT INTO #DateRange (DateValue) VALUES (@CurrentDate);
GO
        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
GO
    END
    
    -- Get provider's weekly availability
    DECLARE @WeeklyAvailability TABLE (
        DayOfWeek TINYINT,
        StartTime TIME,
        EndTime TIME,
        IsAvailable BIT
    );
GO
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
GO
    -- Get blackout dates
    DECLARE @BlackoutDates TABLE (
        StartDate DATE,
        EndDate DATE,
        Reason NVARCHAR(255)
    );
GO
    INSERT INTO @BlackoutDates
    SELECT 
        StartDate,
        EndDate,
        Reason
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (StartDate <= @EndDate AND EndDate >= @StartDate) OR
            IsRecurring = 1
        );
GO
    -- Get booked dates
    DECLARE @BookedDates TABLE (
        EventDate DATE,
        StartTime TIME,
        EndTime TIME
    );
GO
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
GO
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
            FROM @BlackoutDates bd 
            WHERE dr.DateValue BETWEEN bd.StartDate AND bd.EndDate
        ) AS BlackoutReason
    FROM 
        #DateRange dr
        LEFT JOIN @WeeklyAvailability wa ON wa.DayOfWeek = DATEPART(WEEKDAY, dr.DateValue)
    ORDER BY 
        dr.DateValue;
GO
    DROP TABLE #DateRange;
GO
END;
GO

-- sp_Calendar_BlockDates: Mark dates as unavailable
CREATE PROCEDURE sp_Calendar_BlockDates
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE,
    @Reason NVARCHAR(255) = NULL,
    @IsRecurring BIT = 0,
    @RecurrencePattern NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    -- Validate date range
    IF @EndDate < @StartDate
    BEGIN
        RAISERROR('End date must be after start date.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check for existing bookings in this range
    IF EXISTS (
        SELECT 1 
        FROM Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
        WHERE bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
    )
    BEGIN
        RAISERROR('Cannot block dates with existing bookings.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Insert blackout dates
    INSERT INTO ProviderBlackoutDates (
        ProviderID, StartDate, EndDate, Reason, IsRecurring, RecurrencePattern
    )
    VALUES (
        @ProviderID, @StartDate, @EndDate, @Reason, @IsRecurring, @RecurrencePattern
    );
GO
END;
GO

-- sp_Calendar_GetConflicts: Identify booking conflicts
CREATE PROCEDURE sp_Calendar_GetConflicts
    @ProviderID INT,
    @StartDate DATE,
    @EndDate DATE,
    @StartTime TIME,
    @EndTime TIME,
    @ExcludeBookingID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
GO
    -- Validate time range
    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('End time must be after start time.', 16, 1);
GO
        RETURN;
GO
    END
    
    -- Check blackout dates
    SELECT 
        'Blackout' AS ConflictType,
        StartDate,
        EndDate,
        Reason AS ConflictReason
    FROM 
        ProviderBlackoutDates
    WHERE 
        ProviderID = @ProviderID
        AND (
            (@StartDate BETWEEN StartDate AND EndDate) OR
            (@EndDate BETWEEN StartDate AND EndDate) OR
            (StartDate BETWEEN @StartDate AND @EndDate) OR
            (EndDate BETWEEN @StartDate AND @EndDate)
        );
GO
    -- Check existing bookings
    SELECT 
        'Booking' AS ConflictType,
        b.EventDate AS StartDate,
        b.EventDate AS EndDate,
        b.StartTime,
        b.EndTime,
        b.EventName AS ConflictReason,
        b.BookingID
    FROM 
        Bookings b
        INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    WHERE 
        bp.ProviderID = @ProviderID
        AND b.EventDate BETWEEN @StartDate AND @EndDate
        AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
        AND (@ExcludeBookingID IS NULL OR b.BookingID <> @ExcludeBookingID)
        AND (
            (@StartTime >= b.StartTime AND @StartTime < b.EndTime) OR
            (@EndTime > b.StartTime AND @EndTime <= b.EndTime) OR
            (@StartTime <= b.StartTime AND @EndTime >= b.EndTime)
        );
GO
    -- Check weekly availability
    DECLARE @DayOfWeek INT = DATEPART(WEEKDAY, @StartDate);
GO
    IF NOT EXISTS (
        SELECT 1 
        FROM ProviderAvailability 
        WHERE ProviderID = @ProviderID
        AND DayOfWeek = @DayOfWeek
        AND IsAvailable = 1
        AND @StartTime >= StartTime 
        AND @EndTime <= EndTime
    )
    BEGIN
        SELECT 
            'Availability' AS ConflictType,
            @StartDate AS StartDate,
            @EndDate AS EndDate,
            'Provider is not available at the requested time on this day of week.' AS ConflictReason;
GO
    END
END;
GO

