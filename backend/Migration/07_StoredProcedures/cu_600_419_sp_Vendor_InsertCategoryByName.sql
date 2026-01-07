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
    @Category NVARCHAR(50),
    @IsPrimary BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- If this is primary, clear any existing primary flag for this vendor
    IF @IsPrimary = 1
    BEGIN
        UPDATE vendors.VendorCategories 
        SET IsPrimary = 0 
        WHERE VendorProfileID = @VendorProfileID AND IsPrimary = 1;
    END
    
    INSERT INTO vendors.VendorCategories (VendorProfileID, Category, IsPrimary)
    VALUES (@VendorProfileID, @Category, @IsPrimary);
    
    SELECT SCOPE_IDENTITY() AS CategoryID;
END
GO

