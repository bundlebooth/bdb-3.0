-- =============================================
-- Stored Procedure: sp_Vendor_InsertImageWithCaption
-- Description: Inserts a vendor image with caption and returns the ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertImageWithCaption]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertImageWithCaption];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertImageWithCaption]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, Caption, DisplayOrder, IsPrimary)
    OUTPUT INSERTED.ImageID
    VALUES (@VendorProfileID, @ImageURL, @Caption, @DisplayOrder, 0);
END
GO
