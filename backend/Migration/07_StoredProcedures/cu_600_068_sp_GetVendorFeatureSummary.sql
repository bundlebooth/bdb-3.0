/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeatureSummary]
    Phase: 600 - Stored Procedures
    Script: cu_600_068_dbo.sp_GetVendorFeatureSummary.sql
    Description: Creates the [dbo].[sp_GetVendorFeatureSummary] stored procedure
    
    Execution Order: 68
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorFeatureSummary]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorFeatureSummary]'))
    DROP PROCEDURE [dbo].[sp_GetVendorFeatureSummary];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorFeatureSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.CategoryName,
        c.CategoryIcon,
        COUNT(vsf.FeatureID) AS FeatureCount
    FROM VendorFeatureCategories c
    LEFT JOIN VendorFeatures f ON c.CategoryID = f.CategoryID AND f.IsActive = 1
    LEFT JOIN VendorSelectedFeatures vsf ON f.FeatureID = vsf.FeatureID AND vsf.VendorProfileID = @VendorProfileID
    WHERE c.IsActive = 1
    GROUP BY c.CategoryID, c.CategoryName, c.CategoryIcon, c.DisplayOrder
    ORDER BY c.DisplayOrder;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorFeatureSummary] created successfully.';
GO
