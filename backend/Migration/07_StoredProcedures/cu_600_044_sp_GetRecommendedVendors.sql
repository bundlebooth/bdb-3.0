/*
    Migration Script: Create Stored Procedure [vendors.sp_GetRecommended]
    Phase: 600 - Stored Procedures
    Script: cu_600_044_sp_GetRecommendedVendors.sql
    Description: Creates the [vendors].[sp_GetRecommended] stored procedure
    Schema: vendors
    Execution Order: 44
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetRecommended]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetRecommended]'))
    DROP PROCEDURE [vendors].[sp_GetRecommended];
GO

CREATE PROCEDURE [vendors].[sp_GetRecommended]
    @UserID INT,
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendors based on user's activity - simplified version
    SELECT TOP (@Limit) vp.*
    FROM vendors.VendorProfiles vp
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
      AND vp.VendorProfileID NOT IN (
          -- Exclude already viewed vendors
          SELECT DISTINCT VendorProfileID FROM vendors.VendorProfileViews WHERE UserID = @UserID
      )
    ORDER BY vp.AvgRating DESC, vp.TotalBookings DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetRecommended] created successfully.';
GO


