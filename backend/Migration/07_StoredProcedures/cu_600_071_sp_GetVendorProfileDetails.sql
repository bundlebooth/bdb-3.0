/*
    Migration Script: Create Stored Procedure [sp_GetVendorProfileDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_071_dbo.sp_GetVendorProfileDetails.sql
    Description: Creates the [dbo].[sp_GetVendorProfileDetails] stored procedure
    
    Execution Order: 71
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorProfileDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorProfileDetails]'))
    DROP PROCEDURE [dbo].[sp_GetVendorProfileDetails];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorProfileDetails]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorDetails
    WHERE VendorProfileID = @VendorProfileID;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorProfileDetails] created successfully.';
GO
