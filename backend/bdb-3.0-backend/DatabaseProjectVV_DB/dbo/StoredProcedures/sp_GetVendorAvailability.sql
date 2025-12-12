
-- NEW: Get vendor availability (business hours and exceptions)
CREATE   PROCEDURE sp_GetVendorAvailability
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Business Hours (including Timezone)
    SELECT 
        HoursID,
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable,
        Timezone
    FROM VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
    
    -- Availability Exceptions
    SELECT 
        ExceptionID,
        Date,
        StartTime,
        EndTime,
        IsAvailable,
        Reason
    FROM VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY Date;
END;

GO

