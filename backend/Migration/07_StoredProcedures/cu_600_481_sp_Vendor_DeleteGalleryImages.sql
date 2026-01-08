-- =============================================
-- Stored Procedure: vendors.sp_DeleteGalleryImages
-- Description: Deletes gallery images for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteGalleryImages]'))
    DROP PROCEDURE [vendors].[sp_DeleteGalleryImages];
GO

CREATE PROCEDURE [vendors].[sp_DeleteGalleryImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID AND ImageType = 'Gallery';
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

