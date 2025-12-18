-- =============================================
-- Stored Procedure: sp_Vendor_CheckImageExists
-- Description: Checks if an image URL already exists for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_CheckImageExists]'))
    DROP PROCEDURE [dbo].[sp_Vendor_CheckImageExists];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_CheckImageExists]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ImageID FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageURL = @ImageURL;
END
GO
