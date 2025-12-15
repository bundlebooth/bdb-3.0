/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeaturesByCategory]
    Phase: 600 - Stored Procedures
    Script: cu_600_067_dbo.sp_GetVendorFeaturesByCategory.sql
    Description: Creates the [dbo].[sp_GetVendorFeaturesByCategory] stored procedure
    
    Execution Order: 67
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorFeaturesByCategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorFeaturesByCategory]'))
    DROP PROCEDURE [dbo].[sp_GetVendorFeaturesByCategory];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorFeaturesByCategory]
    @CategoryKey NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.FeatureID,
        f.CategoryID,
        f.FeatureName,
        f.FeatureDescription,
        f.FeatureIcon,
        f.DisplayOrder,
        f.IsActive,
        c.CategoryName,
        c.CategoryIcon AS CategoryIconName
    FROM VendorFeatures f
    JOIN VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE f.IsActive = 1 
        AND c.IsActive = 1
        AND (@CategoryKey IS NULL OR c.CategoryName = @CategoryKey)
    ORDER BY f.DisplayOrder, f.FeatureName;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorFeaturesByCategory] created successfully.';
GO
