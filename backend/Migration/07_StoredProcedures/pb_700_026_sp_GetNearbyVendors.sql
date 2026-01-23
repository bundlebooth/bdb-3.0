/*
    Migration Script: Create Stored Procedure [vendors.sp_GetNearby]
    Phase: 600 - Stored Procedures
    Script: cu_600_039_sp_GetNearbyVendors.sql
    Description: Creates the [vendors].[sp_GetNearby] stored procedure
    Schema: vendors
    Execution Order: 39
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetNearby]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetNearby]'))
    DROP PROCEDURE [vendors].[sp_GetNearby];
GO

CREATE PROCEDURE [vendors].[sp_GetNearby]
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
    FROM vendors.VendorProfiles
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

PRINT 'Stored procedure [vendors].[sp_GetNearby] created successfully.';
GO

