
CREATE PROCEDURE sp_GetRecentlyReviewedVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND LastReviewDate IS NOT NULL
      AND LastReviewDate >= DATEADD(DAY, -14, GETDATE())
    ORDER BY LastReviewDate DESC;
END

GO

