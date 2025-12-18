/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeatureCategories]
    Phase: 600 - Stored Procedures
    Script: cu_600_066_dbo.sp_GetVendorFeatureCategories.sql
    Description: Creates the [vendors].[sp_GetFeatureCategories] stored procedure
    
    Execution Order: 66
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetFeatureCategories]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFeatureCategories]'))
    DROP PROCEDURE [vendors].[sp_GetFeatureCategories];
GO

CREATE   PROCEDURE [vendors].[sp_GetFeatureCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CategoryID,
        CategoryName,
        CategoryIcon,
        DisplayOrder,
        IsActive,
        CreatedAt
    FROM vendors.VendorFeatureCategories
    WHERE IsActive = 1
    ORDER BY DisplayOrder, CategoryName;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetFeatureCategories] created successfully.';
GO

