-- =============================================
-- Stored Procedure: vendors.sp_InsertGalleryImage
-- Description: Inserts a gallery image for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertGalleryImage]'))
    DROP PROCEDURE [vendors].[sp_InsertGalleryImage];
GO

CREATE PROCEDURE [vendors].[sp_InsertGalleryImage]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @IsPrimary BIT = 0,
    @DisplayOrder INT = 0,
    @Caption NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, IsPrimary, DisplayOrder, Caption)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @DisplayOrder, @Caption);
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO

