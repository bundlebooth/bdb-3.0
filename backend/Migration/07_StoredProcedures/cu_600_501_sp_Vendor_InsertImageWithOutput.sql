-- =============================================
-- Stored Procedure: vendors.sp_InsertImageWithOutput
-- Description: Inserts a vendor image and returns the ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertImageWithOutput]'))
    DROP PROCEDURE [vendors].[sp_InsertImageWithOutput];
GO

CREATE PROCEDURE [vendors].[sp_InsertImageWithOutput]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, DisplayOrder, IsPrimary)
    OUTPUT INSERTED.ImageID
    VALUES (@VendorProfileID, @ImageURL, @DisplayOrder, 0);
END
GO

