-- =============================================
-- Stored Procedure: vendors.sp_InsertCategory
-- Description: Inserts a category for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertCategory]'))
    DROP PROCEDURE [vendors].[sp_InsertCategory];
GO

CREATE PROCEDURE [vendors].[sp_InsertCategory]
    @VendorProfileID INT,
    @CategoryName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorCategories (VendorProfileID, Category)
    VALUES (@VendorProfileID, @CategoryName);
    
    SELECT SCOPE_IDENTITY() AS VendorCategoryID;
END
GO

