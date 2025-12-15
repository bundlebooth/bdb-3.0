/*
    Migration Script: Create Stored Procedure [sp_GetPremiumVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_041_dbo.sp_GetPremiumVendors.sql
    Description: Creates the [dbo].[sp_GetPremiumVendors] stored procedure
    
    Execution Order: 41
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetPremiumVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetPremiumVendors]'))
    DROP PROCEDURE [dbo].[sp_GetPremiumVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetPremiumVendors]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) vp.*,
        ISNULL(vt.ViewCount7Days, 0) AS ViewCount7Days
    FROM VendorProfiles vp
    LEFT JOIN (
        SELECT VendorProfileID, COUNT(*) AS ViewCount7Days
        FROM VendorProfileViews
        WHERE ViewedAt >= DATEADD(DAY, -7, GETDATE())
        GROUP BY VendorProfileID
    ) vt ON vp.VendorProfileID = vt.VendorProfileID
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
      AND vp.IsPremium = 1
    ORDER BY ISNULL(vt.ViewCount7Days, 0) DESC, vp.TotalBookings DESC, vp.AvgRating DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetPremiumVendors] created successfully.';
GO
