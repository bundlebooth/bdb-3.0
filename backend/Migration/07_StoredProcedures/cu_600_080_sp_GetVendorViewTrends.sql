/*
    Migration Script: Create Stored Procedure [sp_GetVendorViewTrends]
    Phase: 600 - Stored Procedures
    Script: cu_600_080_dbo.sp_GetVendorViewTrends.sql
    Description: Creates the [dbo].[sp_GetVendorViewTrends] stored procedure
    
    Execution Order: 80
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorViewTrends]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorViewTrends]'))
    DROP PROCEDURE [dbo].[sp_GetVendorViewTrends];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorViewTrends]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Compare this week vs last week
    DECLARE @ThisWeekStart DATETIME2 = DATEADD(DAY, -7, GETUTCDATE());
    DECLARE @LastWeekStart DATETIME2 = DATEADD(DAY, -14, GETUTCDATE());
    DECLARE @LastWeekEnd DATETIME2 = DATEADD(DAY, -7, GETUTCDATE());

    SELECT 
        'Last 7 Days' AS Period,
        COUNT(*) AS ViewCount,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @ThisWeekStart
    UNION ALL
    SELECT 
        'Previous 7 Days' AS Period,
        COUNT(*) AS ViewCount,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @LastWeekStart
      AND ViewedAt < @LastWeekEnd;

    -- This month vs last month
    DECLARE @ThisMonthStart DATETIME2 = DATEADD(DAY, -30, GETUTCDATE());
    DECLARE @LastMonthStart DATETIME2 = DATEADD(DAY, -60, GETUTCDATE());
    DECLARE @LastMonthEnd DATETIME2 = DATEADD(DAY, -30, GETUTCDATE());

    SELECT 
        'Last 30 Days' AS Period,
        COUNT(*) AS ViewCount,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @ThisMonthStart
    UNION ALL
    SELECT 
        'Previous 30 Days' AS Period,
        COUNT(*) AS ViewCount,
        COUNT(DISTINCT ViewerUserID) AS UniqueViewers
    FROM VendorProfileViews
    WHERE VendorProfileID = @VendorProfileID
      AND ViewedAt >= @LastMonthStart
      AND ViewedAt < @LastMonthEnd;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorViewTrends] created successfully.';
GO
