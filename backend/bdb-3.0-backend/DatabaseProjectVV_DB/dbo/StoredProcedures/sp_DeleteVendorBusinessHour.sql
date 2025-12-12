
-- NEW: Delete Vendor Business Hour
CREATE   PROCEDURE sp_DeleteVendorBusinessHour
    @HoursID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorBusinessHours WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorBusinessHours WHERE HoursID = @HoursID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Business hour entry not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

