/*
    Stored Procedure: sp_GetFAQCategories
    Description: Gets all active FAQ categories with article counts
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFAQCategories]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_GetFAQCategories]
GO

CREATE PROCEDURE [admin].[sp_GetFAQCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.Name,
        c.Slug,
        c.Description,
        c.Icon,
        c.DisplayOrder,
        c.IsActive,
        c.ParentCategoryID,
        (SELECT COUNT(*) FROM [admin].[FAQs] f WHERE f.CategoryID = c.CategoryID AND f.IsActive = 1) AS ArticleCount
    FROM [admin].[FAQCategories] c
    WHERE c.IsActive = 1
    ORDER BY c.DisplayOrder, c.Name;
END
GO
