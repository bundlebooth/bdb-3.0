
-- Corrected stored procedure for vendor images

CREATE   PROCEDURE sp_GetVendorImages
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;
END;

GO

