
-- NEW: Add/Update Vendor Availability Exception
CREATE   PROCEDURE sp_UpsertVendorAvailabilityException
    @ExceptionID INT = NULL, -- NULL for new, ID for update
    @VendorProfileID INT,
    @Date DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @IsAvailable BIT = 0,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @ExceptionID IS NULL -- Insert new
    BEGIN
        INSERT INTO VendorAvailabilityExceptions (VendorProfileID, Date, StartTime, EndTime, IsAvailable, Reason, CreatedAt, UpdatedAt)
        VALUES (@VendorProfileID, @Date, @StartTime, @EndTime, @IsAvailable, @Reason, GETUTCDATE(), GETUTCDATE());
        SELECT SCOPE_IDENTITY() AS ExceptionID;
    END
    ELSE -- Update existing
    BEGIN
        UPDATE VendorAvailabilityExceptions
        SET
            Date = @Date,
            StartTime = @StartTime,
            EndTime = @EndTime,
            IsAvailable = @IsAvailable,
            Reason = @Reason,
            UpdatedAt = GETUTCDATE()
        WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID;
        SELECT @ExceptionID AS ExceptionID;
    END
END;

GO

