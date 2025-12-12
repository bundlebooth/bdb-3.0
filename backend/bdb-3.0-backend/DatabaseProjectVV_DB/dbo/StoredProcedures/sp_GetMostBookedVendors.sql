
CREATE PROCEDURE sp_GetMostBookedVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND TotalBookings > 0
    ORDER BY TotalBookings DESC;
END

GO

