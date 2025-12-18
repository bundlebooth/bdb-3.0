-- =============================================
-- Stored Procedure: sp_Admin_GetCategories
-- Description: Gets all vendor categories with counts
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetCategories]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetCategories];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Category as CategoryName,
        COUNT(*) as VendorCount
    FROM VendorCategories
    GROUP BY Category
    ORDER BY Category;
END
GO
