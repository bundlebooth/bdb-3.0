-- =============================================
-- Analytics - Get Daily Bookings
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('analytics.sp_GetDailyBookings', 'P') IS NOT NULL
    DROP PROCEDURE analytics.sp_GetDailyBookings;
GO

CREATE PROCEDURE analytics.sp_GetDailyBookings
    @VendorProfileID INT,
    @DaysBack INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CAST(CreatedAt AS DATE) AS BookingDate, 
        COUNT(*) AS BookingCount, 
        SUM(ISNULL(TotalAmount, 0)) AS Revenue
    FROM bookings.Bookings
    WHERE VendorProfileID = @VendorProfileID
    AND CreatedAt >= DATEADD(DAY, -@DaysBack, GETDATE())
    GROUP BY CAST(CreatedAt AS DATE);
END
GO
