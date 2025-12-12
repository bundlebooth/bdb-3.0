
CREATE PROCEDURE sp_GetNearbyVendors
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

