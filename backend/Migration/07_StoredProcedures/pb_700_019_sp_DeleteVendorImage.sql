/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_025_dbo.sp_DeleteVendorImage.sql
    Description: Creates the [vendors].[sp_DeleteImage] stored procedure
    
    Execution Order: 25
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_DeleteImage]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteImage]'))
    DROP PROCEDURE [vendors].[sp_DeleteImage];
GO

CREATE   PROCEDURE [vendors].[sp_DeleteImage]
    @ImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM vendors.VendorImages WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM vendors.VendorImages WHERE ImageID = @ImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_DeleteImage] created successfully.';
GO

