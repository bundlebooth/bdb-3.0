-- =============================================
-- Stored Procedure: sp_Vendor_InsertImageWithPath
-- Description: Inserts an image for a vendor with file path
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertImageWithPath]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertImageWithPath];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertImageWithPath]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(255),
    @IsPrimary BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary);
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO
