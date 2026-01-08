/*
    Migration Script: Create Stored Procedure [sp_GetServiceAvailability]
    Phase: 600 - Stored Procedures
    Script: cu_600_047_dbo.sp_GetServiceAvailability.sql
    Description: Creates the [vendors].[sp_GetServiceAvailability] stored procedure
    
    Execution Order: 47
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetServiceAvailability]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServiceAvailability]'))
    DROP PROCEDURE [vendors].[sp_GetServiceAvailability];
GO

CREATE   PROCEDURE [vendors].[sp_GetServiceAvailability]
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
    FROM vendors.Services s
    JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
    JOIN vendors.VendorProfiles vp ON sc.VendorProfileID = vp.VendorProfileID
    WHERE s.ServiceID = @ServiceID;
    
    -- Get standard business hours
    SELECT 
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable
    FROM vendors.VendorBusinessHours
    WHERE VendorProfileID = (
        SELECT sc.VendorProfileID 
        FROM vendors.Services s
        JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
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
    FROM bookings.Bookings
    WHERE ServiceID = @ServiceID
    AND Status NOT IN ('cancelled', 'rejected')
    AND (
        (EventDate >= @StartDate AND EventDate <= @EndDate) OR
        (EndDate >= @StartDate AND EndDate <= @EndDate) OR
        (EventDate <= @StartDate AND EndDate >= @EndDate)
    )
    ORDER BY EventDate;
    
    -- Get available time slots (simplified date calculation)
    SELECT 
        ts.SlotID,
        ts.DayOfWeek,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        (SELECT COUNT(*) FROM bookings.Bookings b 
         WHERE b.ServiceID = @ServiceID 
         AND b.Status NOT IN ('cancelled', 'rejected')
         AND (
             (ts.Date IS NOT NULL AND CONVERT(DATE, b.EventDate) = ts.Date)
             OR
             (ts.Date IS NULL AND DATEPART(WEEKDAY, b.EventDate) = ts.DayOfWeek + 1)
         )
         AND CONVERT(TIME, b.EventDate) BETWEEN ts.StartTime AND ts.EndTime
        ) AS BookedCount
    FROM bookings.TimeSlots ts
    WHERE ts.ServiceID = @ServiceID
    AND ts.IsAvailable = 1
    AND (
        (ts.Date IS NULL) OR -- Recurring weekly slots
        (ts.Date BETWEEN @StartDate AND @EndDate) -- Specific date slots
    )
    ORDER BY 
        CASE WHEN ts.Date IS NULL THEN DATEADD(DAY, ts.DayOfWeek - DATEPART(WEEKDAY, @StartDate) + 7, @StartDate)
             ELSE ts.Date
        END,
        ts.StartTime;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetServiceAvailability] created successfully.';
GO



