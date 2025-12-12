
-- Corrected stored procedure for vendor bookings

CREATE   PROCEDURE sp_GetVendorBookingsAll
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorBookings
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY EventDate DESC;
END;

GO

