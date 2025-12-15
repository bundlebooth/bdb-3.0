/*
    Migration Script: Create Stored Procedure [sp_GetTrendingVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_051_dbo.sp_GetTrendingVendors.sql
    Description: Creates the [dbo].[sp_GetTrendingVendors] stored procedure
    
    Execution Order: 51
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetTrendingVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetTrendingVendors]'))
    DROP PROCEDURE [dbo].[sp_GetTrendingVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetTrendingVendors]
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
    ORDER BY vt.ViewCount7Days DESC, vp.TotalBookings DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetTrendingVendors] created successfully.';
GO
