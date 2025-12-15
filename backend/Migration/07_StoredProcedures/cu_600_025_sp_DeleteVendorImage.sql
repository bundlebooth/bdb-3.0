/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_025_dbo.sp_DeleteVendorImage.sql
    Description: Creates the [dbo].[sp_DeleteVendorImage] stored procedure
    
    Execution Order: 25
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_DeleteVendorImage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DeleteVendorImage]'))
    DROP PROCEDURE [dbo].[sp_DeleteVendorImage];
GO

CREATE   PROCEDURE [dbo].[sp_DeleteVendorImage]
    @ImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM VendorImages WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID)
    BEGIN
        DELETE FROM VendorImages WHERE ImageID = @ImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [dbo].[sp_DeleteVendorImage] created successfully.';
GO
