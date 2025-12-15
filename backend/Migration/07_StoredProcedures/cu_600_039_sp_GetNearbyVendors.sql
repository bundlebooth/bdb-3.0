/*
    Migration Script: Create Stored Procedure [sp_GetNearbyVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_039_dbo.sp_GetNearbyVendors.sql
    Description: Creates the [dbo].[sp_GetNearbyVendors] stored procedure
    
    Execution Order: 39
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetNearbyVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetNearbyVendors]'))
    DROP PROCEDURE [dbo].[sp_GetNearbyVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetNearbyVendors]
    @Latitude DECIMAL(10,8),
    @Longitude DECIMAL(11,8),
    @RadiusMiles INT = 25,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *,
        (3959 * ACOS(
            COS(RADIANS(@Latitude)) * COS(RADIANS(Latitude)) *
            COS(RADIANS(Longitude) - RADIANS(@Longitude)) +
            SIN(RADIANS(@Latitude)) * SIN(RADIANS(Latitude))
        )) AS DistanceMiles
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND Latitude IS NOT NULL
      AND Longitude IS NOT NULL
      AND (3959 * ACOS(
            COS(RADIANS(@Latitude)) * COS(RADIANS(Latitude)) *
            COS(RADIANS(Longitude) - RADIANS(@Longitude)) +
            SIN(RADIANS(@Latitude)) * SIN(RADIANS(Latitude))
        )) <= @RadiusMiles
    ORDER BY DistanceMiles ASC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetNearbyVendors] created successfully.';
GO
