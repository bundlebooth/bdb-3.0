/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorBusinessHour]
    Phase: 600 - Stored Procedures
    Script: cu_600_024_dbo.sp_DeleteVendorBusinessHour.sql
    Description: Creates the [vendors].[sp_DeleteBusinessHour] stored procedure
    
    Execution Order: 24
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_DeleteBusinessHour]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteBusinessHour]'))
    DROP PROCEDURE [vendors].[sp_DeleteBusinessHour];
GO

CREATE   PROCEDURE [vendors].[sp_DeleteBusinessHour]
    @HoursID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM vendors.VendorBusinessHours WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM vendors.VendorBusinessHours WHERE HoursID = @HoursID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Business hour entry not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_DeleteBusinessHour] created successfully.';
GO

