-- =============================================
-- Stored Procedure: admin.sp_GetAnalytics
-- Description: Gets platform analytics with date range filter
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAnalytics]'))
    DROP PROCEDURE [admin].[sp_GetAnalytics];
GO

CREATE PROCEDURE [admin].[sp_GetAnalytics]
    @Range NVARCHAR(10) = '30d'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DateFilter DATETIME;
    SET @DateFilter = CASE @Range
        WHEN '7d' THEN DATEADD(day, -7, GETDATE())
        WHEN '90d' THEN DATEADD(day, -90, GETDATE())
        WHEN '1y' THEN DATEADD(year, -1, GETDATE())
        ELSE DATEADD(day, -30, GETDATE())
    END;
    
    -- Main stats
    SELECT
        (SELECT COUNT(*) FROM vendors.VendorProfiles) as totalVendors,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'approved') as activeListings,
        (SELECT COUNT(*) FROM users.Users WHERE IsActive = 1) as totalUsers,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE CreatedAt >= @DateFilter) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE CreatedAt >= @DateFilter) as monthlyRevenue,
        (SELECT ISNULL(SUM(TotalAmount * 0.1), 0) FROM bookings.Bookings WHERE CreatedAt >= @DateFilter) as platformFees,
        (SELECT AVG(CAST(TotalAmount as FLOAT)) FROM bookings.Bookings WHERE CreatedAt >= @DateFilter) as averageBookingValue;
    
    -- Top categories
    SELECT TOP 5
        vc.Category as name,
        COUNT(DISTINCT vc.VendorProfileID) as count,
        ISNULL(SUM(b.TotalAmount), 0) as revenue
    FROM vendors.VendorCategories vc
    LEFT JOIN bookings.Bookings b ON vc.VendorProfileID = b.VendorProfileID AND b.CreatedAt >= @DateFilter
    GROUP BY vc.Category
    ORDER BY count DESC;
    
    -- Top vendors
    SELECT TOP 5
        vp.BusinessName as name,
        vp.TotalBookings as bookings,
        ISNULL(SUM(b.TotalAmount), 0) as revenue,
        vp.AvgRating as rating
    FROM vendors.VendorProfiles vp
    LEFT JOIN bookings.Bookings b ON vp.VendorProfileID = b.VendorProfileID AND b.CreatedAt >= @DateFilter
    WHERE vp.ProfileStatus = 'approved'
    GROUP BY vp.VendorProfileID, vp.BusinessName, vp.TotalBookings, vp.AvgRating
    ORDER BY vp.TotalBookings DESC;
    
    -- Booking trends (last 6 months)
    SELECT 
        FORMAT(CreatedAt, 'MMM') as month,
        COUNT(*) as bookings,
        ISNULL(SUM(TotalAmount), 0) as revenue
    FROM bookings.Bookings
    WHERE CreatedAt >= DATEADD(month, -6, GETDATE())
    GROUP BY FORMAT(CreatedAt, 'MMM'), MONTH(CreatedAt)
    ORDER BY MONTH(CreatedAt);
END
GO




