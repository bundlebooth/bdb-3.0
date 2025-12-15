/*
    Migration Script: Create Stored Procedure [sp_GetVendorAnalytics]
    Phase: 600 - Stored Procedures
    Script: cu_600_060_dbo.sp_GetVendorAnalytics.sql
    Description: Creates the [dbo].[sp_GetVendorAnalytics] stored procedure
    
    Execution Order: 60
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorAnalytics]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorAnalytics]'))
    DROP PROCEDURE [dbo].[sp_GetVendorAnalytics];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorAnalytics]
    @VendorProfileID INT,
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATETIME2 = DATEADD(DAY, -@DaysBack, GETUTCDATE());

    -- Total views and unique viewers
    SELECT 
        COUNT(*) AS TotalViews,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers,
        COUNT(DISTINCT CAST(ViewedAt AS DATE)) AS DaysWithViews
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @StartDate;

    -- Daily view breakdown
    SELECT 
        CAST(ViewedAt AS DATE) AS ViewDate,
        COUNT(*) AS ViewCount,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @StartDate
    GROUP BY CAST(ViewedAt AS DATE)
    ORDER BY ViewDate;

    -- Hourly distribution (shows peak viewing hours)
    SELECT 
        DATEPART(HOUR, ViewedAt) AS HourOfDay,
        COUNT(*) AS ViewCount
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @StartDate
    GROUP BY DATEPART(HOUR, ViewedAt)
    ORDER BY HourOfDay;

    -- Top referrers
    SELECT TOP 10
        CASE 
            WHEN ReferrerUrl IS NULL OR ReferrerUrl = '' THEN 'Direct'
            ELSE ReferrerUrl
        END AS Referrer,
        COUNT(*) AS ViewCount
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @StartDate
    GROUP BY ReferrerUrl
    ORDER BY ViewCount DESC;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorAnalytics] created successfully.';
GO
