-- =============================================
-- Stored Procedure: vendors.sp_InsertCategoryByName
-- Description: Sets the single primary category for a vendor (replaces any existing)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- 
-- UPDATED: Now enforces single category per vendor (no additional categories)
-- Always deletes existing categories and inserts the new one as primary
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertCategoryByName]'))
    DROP PROCEDURE [vendors].[sp_InsertCategoryByName];
GO

CREATE PROCEDURE [vendors].[sp_InsertCategoryByName]
    @VendorProfileID INT,
    @Category NVARCHAR(50),
    @IsPrimary BIT = 1  -- Default to primary since we only allow one category now
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete ALL existing categories for this vendor (single category model)
        DELETE FROM vendors.VendorCategories 
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert the new category as primary
        INSERT INTO vendors.VendorCategories (VendorProfileID, Category, IsPrimary)
        VALUES (@VendorProfileID, @Category, 1);  -- Always primary
        
        COMMIT TRANSACTION;
        
        SELECT SCOPE_IDENTITY() AS CategoryID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

