/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetVendorProfileByUserId]
    Phase: 600 - Stored Procedures
    Script: cu_600_673_sp_Vendors_GetVendorProfileByUserId.sql
    Description: Creates the [vendors].[sp_GetVendorProfileByUserId] stored procedure
                 Used by GET /api/users/:id/vendor-profile endpoint
    
    Execution Order: 673
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetVendorProfileByUserId]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorProfileByUserId]'))
    DROP PROCEDURE [vendors].[sp_GetVendorProfileByUserId];
GO

CREATE PROCEDURE [vendors].[sp_GetVendorProfileByUserId]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * 
    FROM vendors.VendorProfiles 
    WHERE UserID = @UserID;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetVendorProfileByUserId] created successfully.';
GO
