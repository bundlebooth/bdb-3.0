/*
    Migration Script: Create Stored Procedure [sp_GetVendorFeatureSummary]
    Phase: 600 - Stored Procedures
    Script: cu_600_068_dbo.sp_GetVendorFeatureSummary.sql
    Description: Creates the [vendors].[sp_GetFeatureSummary] stored procedure
    
    Execution Order: 68
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetFeatureSummary]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFeatureSummary]'))
    DROP PROCEDURE [vendors].[sp_GetFeatureSummary];
GO

CREATE   PROCEDURE [vendors].[sp_GetFeatureSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.CategoryName,
        c.CategoryIcon,
        COUNT(vsf.FeatureID) AS FeatureCount
    FROM vendors.VendorFeatureCategories c
    LEFT JOIN vendors.VendorFeatures f ON c.CategoryID = f.CategoryID AND f.IsActive = 1
    LEFT JOIN vendors.VendorSelectedFeatures vsf ON f.FeatureID = vsf.FeatureID AND vsf.VendorProfileID = @VendorProfileID
    WHERE c.IsActive = 1
    GROUP BY c.CategoryID, c.CategoryName, c.CategoryIcon, c.DisplayOrder
    ORDER BY c.DisplayOrder;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetFeatureSummary] created successfully.';
GO



