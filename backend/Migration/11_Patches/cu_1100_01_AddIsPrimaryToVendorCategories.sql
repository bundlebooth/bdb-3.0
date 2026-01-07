/*
    Migration Script: Add IsPrimary column to VendorCategories
    Phase: 1100 - Patches
    Script: cu_1100_01_AddIsPrimaryToVendorCategories.sql
    Description: Adds IsPrimary column to track primary vs additional categories
    
    This patch:
    1. Adds IsPrimary column if it doesn't exist
    2. Sets the first category (by VendorCategoryID) for each vendor as primary
*/

SET NOCOUNT ON;
GO

PRINT 'Adding IsPrimary column to [vendors].[VendorCategories]...';
GO

-- Add IsPrimary column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorCategories]') AND name = 'IsPrimary')
BEGIN
    ALTER TABLE [vendors].[VendorCategories] ADD [IsPrimary] [bit] NOT NULL DEFAULT 0;
    PRINT 'Added IsPrimary column to [vendors].[VendorCategories].';
    
    -- Set the first category for each vendor as primary (based on lowest VendorCategoryID)
    ;WITH FirstCategories AS (
        SELECT VendorCategoryID,
               ROW_NUMBER() OVER (PARTITION BY VendorProfileID ORDER BY VendorCategoryID) AS RowNum
        FROM vendors.VendorCategories
    )
    UPDATE vc
    SET IsPrimary = 1
    FROM vendors.VendorCategories vc
    INNER JOIN FirstCategories fc ON vc.VendorCategoryID = fc.VendorCategoryID
    WHERE fc.RowNum = 1;
    
    PRINT 'Set first category as primary for all existing vendors.';
END
ELSE
BEGIN
    PRINT 'IsPrimary column already exists. Skipping.';
END
GO

PRINT 'Patch completed successfully.';
GO
