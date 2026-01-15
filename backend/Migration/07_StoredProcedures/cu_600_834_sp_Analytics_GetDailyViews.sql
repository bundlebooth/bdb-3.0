-- =============================================
-- Analytics - Get Daily Views
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('analytics.sp_GetDailyViews', 'P') IS NOT NULL
    DROP PROCEDURE analytics.sp_GetDailyViews;
GO

CREATE PROCEDURE analytics.sp_GetDailyViews
    @VendorProfileID INT,
    @DaysBack INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CAST(ViewedAt AS DATE) AS ViewDate, 
        COUNT(*) AS ViewCount
    FROM vendors.VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
    AND ViewedAt >= DATEADD(DAY, -@DaysBack, GETDATE())
    GROUP BY CAST(ViewedAt AS DATE);
END
GO
