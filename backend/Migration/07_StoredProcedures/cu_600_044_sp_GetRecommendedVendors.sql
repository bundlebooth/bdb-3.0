/*
    Migration Script: Create Stored Procedure [sp_GetRecommendedVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_044_dbo.sp_GetRecommendedVendors.sql
    Description: Creates the [dbo].[sp_GetRecommendedVendors] stored procedure
    
    Execution Order: 44
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetRecommendedVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetRecommendedVendors]'))
    DROP PROCEDURE [dbo].[sp_GetRecommendedVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetRecommendedVendors]
    @UserID INT,
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendors based on user's activity - simplified version
    SELECT TOP (@Limit) vp.*
    FROM VendorProfiles vp
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
      AND vp.VendorProfileID NOT IN (
          -- Exclude already viewed vendors
          SELECT DISTINCT VendorProfileID FROM VendorProfileViews WHERE UserID = @UserID
      )
    ORDER BY vp.AvgRating DESC, vp.TotalBookings DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetRecommendedVendors] created successfully.';
GO
