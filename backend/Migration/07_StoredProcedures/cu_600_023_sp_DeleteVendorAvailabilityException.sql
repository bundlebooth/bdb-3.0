/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorAvailabilityException]
    Phase: 600 - Stored Procedures
    Script: cu_600_023_dbo.sp_DeleteVendorAvailabilityException.sql
    Description: Creates the [vendors].[sp_DeleteAvailabilityException] stored procedure
    
    Execution Order: 23
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_DeleteAvailabilityException]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteAvailabilityException]'))
    DROP PROCEDURE [vendors].[sp_DeleteAvailabilityException];
GO

CREATE   PROCEDURE [vendors].[sp_DeleteAvailabilityException]
    @ExceptionID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM vendors.VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM vendors.VendorAvailabilityExceptions WHERE ExceptionID = @ExceptionID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Availability exception not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_DeleteAvailabilityException] created successfully.';
GO

