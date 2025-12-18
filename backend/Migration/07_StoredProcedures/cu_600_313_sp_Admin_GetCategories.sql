-- =============================================
-- Stored Procedure: admin.sp_GetCategories
-- Description: Gets all vendor categories with counts
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetCategories]'))
    DROP PROCEDURE [admin].[sp_GetCategories];
GO

CREATE PROCEDURE [admin].[sp_GetCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Category as CategoryName,
        COUNT(*) as VendorCount
    FROM vendors.VendorCategories
    GROUP BY Category
    ORDER BY Category;
END
GO

