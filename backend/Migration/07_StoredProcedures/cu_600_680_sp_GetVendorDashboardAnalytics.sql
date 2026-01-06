/*
    Migration Script: Create Stored Procedure [analytics].[sp_GetVendorDashboardAnalytics]
    Phase: 600 - Stored Procedures
    Script: cu_600_680_sp_GetVendorDashboardAnalytics.sql
    Description: Returns all analytics data needed for vendor dashboard graphs
                 - Profile views by month
                 - Bookings by month
                 - Revenue by month
                 - Booking status breakdown
                 - Summary metrics
    
    Dependencies:
        - Schema: analytics (created in 01_Schemas/cu_000_01_CreateSchemas.sql)
        - Table: vendors.VendorProfileViews
        - Table: bookings.Bookings
        - Table: users.Favorites
        - Table: vendors.Reviews
    
    Execution Order: 680
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [analytics].[sp_GetVendorDashboardAnalytics]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[analytics].[sp_GetVendorDashboardAnalytics]'))
    DROP PROCEDURE [analytics].[sp_GetVendorDashboardAnalytics];
GO

CREATE PROCEDURE [analytics].[sp_GetVendorDashboardAnalytics]
    @VendorProfileID INT,
    @DaysBack INT = 180
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATE = DATEADD(DAY, -@DaysBack, GETDATE());
    DECLARE @EndDate DATE = GETDATE();
    
    -- Generate month series for the period
    ;WITH MonthSeries AS (
        SELECT 
            DATEFROMPARTS(YEAR(@StartDate), MONTH(@StartDate), 1) AS MonthStart
        UNION ALL
        SELECT 
            DATEADD(MONTH, 1, MonthStart)
        FROM MonthSeries
        WHERE DATEADD(MONTH, 1, MonthStart) <= @EndDate
    )
    
    -- Result Set 1: Monthly data (views, bookings, revenue)
    SELECT 
        ms.MonthStart,
        FORMAT(ms.MonthStart, 'MMM') AS MonthLabel,
        FORMAT(ms.MonthStart, 'yyyy-MM') AS MonthKey,
        ISNULL(v.ViewCount, 0) AS ViewCount,
        ISNULL(b.BookingCount, 0) AS BookingCount,
        ISNULL(b.Revenue, 0) AS Revenue
    FROM MonthSeries ms
    LEFT JOIN (
        -- Aggregate profile views by month
        SELECT 
            DATEFROMPARTS(YEAR(ViewedAt), MONTH(ViewedAt), 1) AS MonthStart,
            COUNT(*) AS ViewCount
        FROM vendors.VendorProfileViews
        WHERE VendorProfileID = @VendorProfileID
          AND ViewedAt >= @StartDate
        GROUP BY DATEFROMPARTS(YEAR(ViewedAt), MONTH(ViewedAt), 1)
    ) v ON v.MonthStart = ms.MonthStart
    LEFT JOIN (
        -- Aggregate bookings and revenue by month
        SELECT 
            DATEFROMPARTS(YEAR(ISNULL(EventDate, CreatedAt)), MONTH(ISNULL(EventDate, CreatedAt)), 1) AS MonthStart,
            COUNT(*) AS BookingCount,
            SUM(CASE WHEN FullAmountPaid = 1 OR Status IN ('paid', 'completed') THEN ISNULL(TotalAmount, 0) ELSE 0 END) AS Revenue
        FROM bookings.Bookings
        WHERE VendorProfileID = @VendorProfileID
          AND ISNULL(EventDate, CreatedAt) >= @StartDate
        GROUP BY DATEFROMPARTS(YEAR(ISNULL(EventDate, CreatedAt)), MONTH(ISNULL(EventDate, CreatedAt)), 1)
    ) b ON b.MonthStart = ms.MonthStart
    ORDER BY ms.MonthStart
    OPTION (MAXRECURSION 24);
    
    -- Result Set 2: Summary metrics
    SELECT 
        (SELECT COUNT(*) FROM vendors.VendorProfileViews WHERE VendorProfileID = @VendorProfileID AND ViewedAt >= @StartDate) AS TotalViews,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID AND ISNULL(EventDate, CreatedAt) >= @StartDate) AS TotalBookings,
        (SELECT ISNULL(SUM(CASE WHEN FullAmountPaid = 1 OR Status IN ('paid', 'completed') THEN TotalAmount ELSE 0 END), 0) 
         FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID AND ISNULL(EventDate, CreatedAt) >= @StartDate) AS TotalRevenue;
    
    -- Result Set 3: Booking status breakdown
    SELECT 
        ISNULL(SUM(CASE WHEN LOWER(Status) = 'pending' THEN 1 ELSE 0 END), 0) AS PendingCount,
        ISNULL(SUM(CASE WHEN LOWER(Status) IN ('confirmed', 'accepted', 'approved') THEN 1 ELSE 0 END), 0) AS ConfirmedCount,
        ISNULL(SUM(CASE WHEN LOWER(Status) IN ('completed', 'paid') THEN 1 ELSE 0 END), 0) AS CompletedCount,
        ISNULL(SUM(CASE WHEN LOWER(Status) IN ('cancelled', 'declined') THEN 1 ELSE 0 END), 0) AS CancelledCount
    FROM bookings.Bookings
    WHERE VendorProfileID = @VendorProfileID
      AND ISNULL(EventDate, CreatedAt) >= @StartDate;
    
    -- Result Set 4: Additional metrics (Favorites is in users schema)
    SELECT 
        (SELECT COUNT(*) FROM users.Favorites WHERE VendorProfileID = @VendorProfileID) AS FavoriteCount,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID) AS ReviewCount,
        (SELECT ISNULL(AVG(CAST(Rating AS FLOAT)), 5.0) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID) AS AvgRating;
END;
GO

PRINT 'Stored procedure [analytics].[sp_GetVendorDashboardAnalytics] created successfully.';
GO
