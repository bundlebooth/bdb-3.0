-- =============================================
-- Stored Procedure: vendors.sp_InsertGalleryImageFull
-- Description: Inserts a gallery image with all fields for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertGalleryImageFull]'))
    DROP PROCEDURE [vendors].[sp_InsertGalleryImageFull];
GO

CREATE PROCEDURE [vendors].[sp_InsertGalleryImageFull]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @Caption NVARCHAR(255) = '',
    @ImageType NVARCHAR(20) = 'Gallery',
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, Caption, ImageType, DisplayOrder, IsPrimary, CreatedAt)
    VALUES (@VendorProfileID, @ImageURL, @Caption, @ImageType, @DisplayOrder, 0, GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO

