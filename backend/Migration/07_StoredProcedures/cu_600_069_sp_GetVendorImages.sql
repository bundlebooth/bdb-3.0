/*
    Migration Script: Create Stored Procedure [sp_GetVendorImages]
    Phase: 600 - Stored Procedures
    Script: cu_600_069_dbo.sp_GetVendorImages.sql
    Description: Creates the [vendors].[sp_GetImages] stored procedure
    
    Execution Order: 69
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetImages]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetImages]'))
    DROP PROCEDURE [vendors].[sp_GetImages];
GO

CREATE   PROCEDURE [vendors].[sp_GetImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vendors.VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY IsPrimary DESC, DisplayOrder;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetImages] created successfully.';
GO

