-- =============================================
-- Stored Procedure: sp_Vendor_InsertImage
-- Description: Inserts an image for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertImage]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertImage];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertImage]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @IsPrimary BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, CreatedAt)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO
