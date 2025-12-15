/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeatureCategories]
    Phase: 600 - Stored Procedures
    Script: cu_600_066_dbo.sp_GetVendorFeatureCategories.sql
    Description: Creates the [dbo].[sp_GetVendorFeatureCategories] stored procedure
    
    Execution Order: 66
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorFeatureCategories]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorFeatureCategories]'))
    DROP PROCEDURE [dbo].[sp_GetVendorFeatureCategories];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorFeatureCategories]
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
    FROM VendorFeatureCategories
    WHERE IsActive = 1
    ORDER BY DisplayOrder, CategoryName;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorFeatureCategories] created successfully.';
GO
