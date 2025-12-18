-- =============================================
-- Stored Procedure: sp_Vendor_InsertGalleryImage
-- Description: Inserts a gallery image for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertGalleryImage]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertGalleryImage];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertGalleryImage]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @IsPrimary BIT = 0,
    @DisplayOrder INT = 0,
    @Caption NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, DisplayOrder, Caption)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @DisplayOrder, @Caption);
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO
