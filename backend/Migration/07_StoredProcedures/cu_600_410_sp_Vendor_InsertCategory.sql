-- =============================================
-- Stored Procedure: sp_Vendor_InsertCategory
-- Description: Inserts a category for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertCategory]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertCategory];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertCategory]
    @VendorProfileID INT,
    @CategoryName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorCategories (VendorProfileID, Category)
    VALUES (@VendorProfileID, @CategoryName);
    
    SELECT SCOPE_IDENTITY() AS VendorCategoryID;
END
GO
