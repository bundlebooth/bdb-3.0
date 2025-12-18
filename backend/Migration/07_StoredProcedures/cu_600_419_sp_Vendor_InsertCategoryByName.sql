-- =============================================
-- Stored Procedure: sp_Vendor_InsertCategoryByName
-- Description: Inserts a category for a vendor using Category column
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertCategoryByName]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertCategoryByName];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertCategoryByName]
    @VendorProfileID INT,
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorCategories (VendorProfileID, Category)
    VALUES (@VendorProfileID, @Category);
    
    SELECT SCOPE_IDENTITY() AS CategoryID;
END
GO
