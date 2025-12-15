/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorAvailabilityException]
    Phase: 600 - Stored Procedures
    Script: cu_600_023_dbo.sp_DeleteVendorAvailabilityException.sql
    Description: Creates the [dbo].[sp_DeleteVendorAvailabilityException] stored procedure
    
    Execution Order: 23
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_DeleteVendorAvailabilityException]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DeleteVendorAvailabilityException]'))
    DROP PROCEDURE [dbo].[sp_DeleteVendorAvailabilityException];
GO

CREATE   PROCEDURE [dbo].[sp_DeleteVendorAvailabilityException]
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

PRINT 'Stored procedure [dbo].[sp_DeleteVendorAvailabilityException] created successfully.';
GO
