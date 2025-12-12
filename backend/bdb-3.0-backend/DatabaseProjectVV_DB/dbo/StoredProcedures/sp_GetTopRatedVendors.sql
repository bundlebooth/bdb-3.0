
CREATE PROCEDURE sp_GetTopRatedVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND AvgRating >= 4.5
      AND TotalReviews >= 5
    ORDER BY AvgRating DESC, TotalReviews DESC;
END

GO

