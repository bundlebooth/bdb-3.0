/*
    Migration Script: Create Stored Procedure [vendors.sp_GetTrending]
    Phase: 600 - Stored Procedures
    Script: cu_600_051_sp_GetTrendingVendors.sql
    Description: Creates the [vendors].[sp_GetTrending] stored procedure
    Schema: vendors
    Execution Order: 51
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetTrending]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetTrending]'))
    DROP PROCEDURE [vendors].[sp_GetTrending];
GO

CREATE PROCEDURE [vendors].[sp_GetTrending]
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
    ORDER BY vt.ViewCount7Days DESC, vp.TotalBookings DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetTrending] created successfully.';
GO


