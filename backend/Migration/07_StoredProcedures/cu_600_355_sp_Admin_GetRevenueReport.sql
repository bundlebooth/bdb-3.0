-- =============================================
-- Stored Procedure: sp_Admin_GetRevenueReport
-- Description: Gets daily revenue report for a date range
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetRevenueReport]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetRevenueReport];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetRevenueReport]
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
    FROM Bookings
    WHERE CreatedAt >= @StartDate AND CreatedAt <= @EndDate
    GROUP BY CAST(CreatedAt as DATE)
    ORDER BY date;
END
GO
