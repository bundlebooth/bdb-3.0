/*
    Migration Script: Create Stored Procedure [vendors.sp_GetPremium]
    Phase: 600 - Stored Procedures
    Script: cu_600_041_sp_GetPremiumVendors.sql
    Description: Creates the [vendors].[sp_GetPremium] stored procedure
    Schema: vendors
    Execution Order: 41
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetPremium]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPremium]'))
    DROP PROCEDURE [vendors].[sp_GetPremium];
GO

CREATE PROCEDURE [vendors].[sp_GetPremium]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) vp.*,
        ISNULL(vt.ViewCount7Days, 0) AS ViewCount7Days
    FROM vendors.VendorProfiles vp
    LEFT JOIN (
        SELECT VendorProfileID, COUNT(*) AS ViewCount7Days
        FROM vendors.VendorProfileViews
        WHERE ViewedAt >= DATEADD(DAY, -7, GETDATE())
        GROUP BY VendorProfileID
    ) vt ON vp.VendorProfileID = vt.VendorProfileID
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
      AND vp.IsPremium = 1
    ORDER BY ISNULL(vt.ViewCount7Days, 0) DESC, vp.TotalBookings DESC, vp.AvgRating DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetPremium] created successfully.';
GO


