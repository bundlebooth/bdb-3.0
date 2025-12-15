/*
    Migration Script: Create Stored Procedure [sp_GetVendorImages]
    Phase: 600 - Stored Procedures
    Script: cu_600_069_dbo.sp_GetVendorImages.sql
    Description: Creates the [dbo].[sp_GetVendorImages] stored procedure
    
    Execution Order: 69
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorImages]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorImages]'))
    DROP PROCEDURE [dbo].[sp_GetVendorImages];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorImages] created successfully.';
GO
