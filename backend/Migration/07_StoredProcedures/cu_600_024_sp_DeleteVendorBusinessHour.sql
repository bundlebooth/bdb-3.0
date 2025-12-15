/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorBusinessHour]
    Phase: 600 - Stored Procedures
    Script: cu_600_024_dbo.sp_DeleteVendorBusinessHour.sql
    Description: Creates the [dbo].[sp_DeleteVendorBusinessHour] stored procedure
    
    Execution Order: 24
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_DeleteVendorBusinessHour]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DeleteVendorBusinessHour]'))
    DROP PROCEDURE [dbo].[sp_DeleteVendorBusinessHour];
GO

CREATE   PROCEDURE [dbo].[sp_DeleteVendorBusinessHour]
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

PRINT 'Stored procedure [dbo].[sp_DeleteVendorBusinessHour] created successfully.';
GO
