
CREATE PROCEDURE sp_GetRecommendedVendors
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

