
-- NEW: Add/Update Vendor Business Hour
CREATE   PROCEDURE sp_UpsertVendorBusinessHour
    @HoursID INT = NULL, -- NULL for new, ID for update
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime TIME = NULL,
    @CloseTime TIME = NULL,
    @IsAvailable BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @HoursID IS NULL -- Insert new
    BEGIN
        INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
        VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable);
        SELECT SCOPE_IDENTITY() AS HoursID;
    END
    ELSE -- Update existing
    BEGIN
        UPDATE VendorBusinessHours
        SET
            OpenTime = @OpenTime,
            CloseTime = @CloseTime,
            IsAvailable = @IsAvailable
        WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID;
        SELECT @HoursID AS HoursID;
    END
END;

GO

