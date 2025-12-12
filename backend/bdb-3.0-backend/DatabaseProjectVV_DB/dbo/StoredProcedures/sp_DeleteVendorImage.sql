
-- NEW: Delete Vendor Image
CREATE   PROCEDURE sp_DeleteVendorImage
    @ImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorImages WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorImages WHERE ImageID = @ImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

