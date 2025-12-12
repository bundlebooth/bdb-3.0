
-- Corrected stored procedure for vendor profile details

CREATE   PROCEDURE sp_GetVendorProfileDetails
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorDetails
    WHERE VendorProfileID = @VendorProfileID;
END;

GO

