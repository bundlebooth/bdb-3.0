/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeaturesByCategory]
    Phase: 600 - Stored Procedures
    Script: cu_600_067_dbo.sp_GetVendorFeaturesByCategory.sql
    Description: Creates the [vendors].[sp_GetFeaturesByCategory] stored procedure
    
    Execution Order: 67
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetFeaturesByCategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFeaturesByCategory]'))
    DROP PROCEDURE [vendors].[sp_GetFeaturesByCategory];
GO

CREATE   PROCEDURE [vendors].[sp_GetFeaturesByCategory]
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
    FROM vendors.VendorFeatures f
    JOIN vendors.VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE f.IsActive = 1 
        AND c.IsActive = 1
        AND (@CategoryKey IS NULL OR c.CategoryName = @CategoryKey)
    ORDER BY f.DisplayOrder, f.FeatureName;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetFeaturesByCategory] created successfully.';
GO


