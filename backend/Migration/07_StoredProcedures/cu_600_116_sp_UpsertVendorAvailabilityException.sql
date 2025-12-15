/*
    Migration Script: Create Stored Procedure [sp_UpsertVendorAvailabilityException]
    Phase: 600 - Stored Procedures
    Script: cu_600_116_dbo.sp_UpsertVendorAvailabilityException.sql
    Description: Creates the [dbo].[sp_UpsertVendorAvailabilityException] stored procedure
    
    Execution Order: 116
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpsertVendorAvailabilityException]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertVendorAvailabilityException]'))
    DROP PROCEDURE [dbo].[sp_UpsertVendorAvailabilityException];
GO

CREATE   PROCEDURE [dbo].[sp_UpsertVendorAvailabilityException]
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

PRINT 'Stored procedure [dbo].[sp_UpsertVendorAvailabilityException] created successfully.';
GO
