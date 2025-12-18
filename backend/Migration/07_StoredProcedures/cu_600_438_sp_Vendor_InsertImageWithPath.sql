-- =============================================
-- Stored Procedure: vendors.sp_InsertImageWithPath
-- Description: Inserts an image for a vendor with file path
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertImageWithPath]'))
    DROP PROCEDURE [vendors].[sp_InsertImageWithPath];
GO

CREATE PROCEDURE [vendors].[sp_InsertImageWithPath]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(255),
    @IsPrimary BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, IsPrimary)
    VALUES (@VendorProfileID, @ImageURL, @IsPrimary);
    
    SELECT SCOPE_IDENTITY() AS ImageID;
END
GO

