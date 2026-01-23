-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetAnalytics
-- Description: Gets vendor analytics data
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetAnalytics]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetAnalytics];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetAnalytics]
    @VendorProfileID INT,
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Booking stats
    SELECT 
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS CompletedBookings,
        COUNT(CASE WHEN Status = 'Confirmed' THEN 1 END) AS ConfirmedBookings,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS PendingBookings,
        COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) AS CancelledBookings,
        COUNT(*) AS TotalBookings
    FROM bookings.Bookings
    WHERE VendorProfileID = @VendorProfileID
        AND EventDate >= DATEADD(DAY, -@DaysBack, GETUTCDATE());
    
    -- Revenue by service
    SELECT 
        s.Name AS ServiceName,
        COUNT(b.BookingID) AS BookingCount,
        SUM(b.TotalAmount) AS TotalRevenue
    FROM vendors.Services s
    LEFT JOIN bookings.Bookings b ON s.ServiceID = b.ServiceID
    WHERE s.VendorProfileID = @VendorProfileID
        AND (b.EventDate >= DATEADD(DAY, -@DaysBack, GETUTCDATE()) OR b.EventDate IS NULL)
    GROUP BY s.ServiceID, s.Name
    ORDER BY TotalRevenue DESC;
    
    -- Revenue by month
    SELECT 
        FORMAT(EventDate, 'yyyy-MM') AS Month,
        COUNT(*) AS BookingCount,
        SUM(TotalAmount) AS TotalRevenue
    FROM bookings.Bookings
    WHERE VendorProfileID = @VendorProfileID
        AND EventDate >= DATEADD(MONTH, -12, GETUTCDATE())
    GROUP BY FORMAT(EventDate, 'yyyy-MM')
    ORDER BY Month;
    
    -- Review stats
    SELECT 
        COUNT(*) AS TotalReviews,
        AVG(CAST(Rating AS FLOAT)) AS AverageRating,
        COUNT(CASE WHEN Rating = 5 THEN 1 END) AS FiveStarCount,
        COUNT(CASE WHEN Rating = 4 THEN 1 END) AS FourStarCount,
        COUNT(CASE WHEN Rating = 3 THEN 1 END) AS ThreeStarCount,
        COUNT(CASE WHEN Rating = 2 THEN 1 END) AS TwoStarCount,
        COUNT(CASE WHEN Rating = 1 THEN 1 END) AS OneStarCount
    FROM vendors.Reviews
    WHERE VendorProfileID = @VendorProfileID
        AND IsApproved = 1;
END
GO


