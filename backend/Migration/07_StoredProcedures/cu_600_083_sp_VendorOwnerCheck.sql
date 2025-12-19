/*
    Migration Script: Create Stored Procedure for Vendor Owner Check
    Phase: 600 - Stored Procedures
    Script: cu_600_083_sp_VendorOwnerCheck.sql
    Description: Creates stored procedure for checking vendor ownership
    Schema: vendors
    Execution Order: 83
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetVendorOwner]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorOwner]'))
    DROP PROCEDURE [vendors].[sp_GetVendorOwner];
GO

CREATE PROCEDURE [vendors].[sp_GetVendorOwner]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID 
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetVendorOwner] created successfully.';
GO
