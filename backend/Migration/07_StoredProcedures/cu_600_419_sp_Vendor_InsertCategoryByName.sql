-- =============================================
-- Stored Procedure: vendors.sp_InsertCategoryByName
-- Description: Inserts a category for a vendor using Category column
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertCategoryByName]'))
    DROP PROCEDURE [vendors].[sp_InsertCategoryByName];
GO

CREATE PROCEDURE [vendors].[sp_InsertCategoryByName]
    @VendorProfileID INT,
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorCategories (VendorProfileID, Category)
    VALUES (@VendorProfileID, @Category);
    
    SELECT SCOPE_IDENTITY() AS CategoryID;
END
GO

