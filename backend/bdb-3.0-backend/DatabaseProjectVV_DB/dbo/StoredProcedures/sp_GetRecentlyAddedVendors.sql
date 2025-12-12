
CREATE PROCEDURE sp_GetRecentlyAddedVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND CreatedAt >= DATEADD(DAY, -30, GETDATE())
    ORDER BY CreatedAt DESC;
END

GO

