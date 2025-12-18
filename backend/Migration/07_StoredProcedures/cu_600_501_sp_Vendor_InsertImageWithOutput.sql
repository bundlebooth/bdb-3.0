-- =============================================
-- Stored Procedure: sp_Vendor_InsertImageWithOutput
-- Description: Inserts a vendor image and returns the ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertImageWithOutput]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertImageWithOutput];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertImageWithOutput]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, DisplayOrder, IsPrimary)
    OUTPUT INSERTED.ImageID
    VALUES (@VendorProfileID, @ImageURL, @DisplayOrder, 0);
END
GO
