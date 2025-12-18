-- =============================================
-- Stored Procedure: admin.sp_GetRevenueReport
-- Description: Gets daily revenue report for a date range
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetRevenueReport]'))
    DROP PROCEDURE [admin].[sp_GetRevenueReport];
GO

CREATE PROCEDURE [admin].[sp_GetRevenueReport]
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @StartDate IS NULL SET @StartDate = DATEADD(day, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        CAST(CreatedAt as DATE) as date,
        COUNT(*) as bookings,
        ISNULL(SUM(TotalAmount), 0) as revenue,
        ISNULL(SUM(TotalAmount * 0.1), 0) as platformFees
    FROM bookings.Bookings
    WHERE CreatedAt >= @StartDate AND CreatedAt <= @EndDate
    GROUP BY CAST(CreatedAt as DATE)
    ORDER BY date;
END
GO

