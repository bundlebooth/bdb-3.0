/*
    Stored Procedure: admin.sp_GetUpcomingEventReminders
    Description: Gets bookings that need event reminders queued
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetUpcomingEventReminders'))
    DROP PROCEDURE admin.sp_GetUpcomingEventReminders
GO

CREATE PROCEDURE admin.sp_GetUpcomingEventReminders
    @DaysAhead INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID, b.EventDate, b.EventTime AS StartTime, b.EventEndTime AS EndTime, b.TimeZone AS Timezone, b.EventLocation,
        s.Name AS ServiceName,
        cu.UserID AS ClientUserID, cu.Email AS ClientEmail, cu.Name AS ClientName,
        vu.UserID AS VendorUserID, vu.Email AS VendorEmail, v.BusinessName AS VendorName
    FROM bookings.Bookings b
    INNER JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    INNER JOIN users.Users cu ON b.UserID = cu.UserID
    INNER JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    INNER JOIN users.Users vu ON v.UserID = vu.UserID
    WHERE b.Status = 'confirmed'
        AND CAST(b.EventDate AS DATE) = CAST(DATEADD(DAY, @DaysAhead, GETDATE()) AS DATE)
        AND NOT EXISTS (
            SELECT 1 FROM admin.EmailQueue eq 
            WHERE eq.BookingID = b.BookingID AND eq.TemplateKey = 'event_reminder'
                AND eq.Metadata LIKE '%"daysAhead":' + CAST(@DaysAhead AS VARCHAR) + '%'
        );
END
GO
