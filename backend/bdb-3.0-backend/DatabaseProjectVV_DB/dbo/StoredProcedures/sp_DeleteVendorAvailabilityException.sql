
-- NEW: Delete Vendor Availability Exception
CREATE   PROCEDURE sp_DeleteVendorAvailabilityException
    @ExceptionID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Availability exception not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

