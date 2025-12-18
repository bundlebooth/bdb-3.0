-- =============================================
-- Stored Procedure: sp_Vendor_DeleteGalleryImages
-- Description: Deletes gallery images for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_DeleteGalleryImages]'))
    DROP PROCEDURE [dbo].[sp_Vendor_DeleteGalleryImages];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_DeleteGalleryImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageType = 'Gallery';
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
