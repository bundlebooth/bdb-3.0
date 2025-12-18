-- =============================================
-- Stored Procedure: vendors.sp_InsertImageWithCaption
-- Description: Inserts a vendor image with caption and returns the ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertImageWithCaption]'))
    DROP PROCEDURE [vendors].[sp_InsertImageWithCaption];
GO

CREATE PROCEDURE [vendors].[sp_InsertImageWithCaption]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, Caption, DisplayOrder, IsPrimary)
    OUTPUT INSERTED.ImageID
    VALUES (@VendorProfileID, @ImageURL, @Caption, @DisplayOrder, 0);
END
GO

