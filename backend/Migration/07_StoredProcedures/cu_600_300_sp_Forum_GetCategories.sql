-- =============================================
-- Stored Procedure: forum.sp_GetCategories
-- Description: Get all forum categories with post counts
-- =============================================

CREATE OR ALTER PROCEDURE [forum].[sp_GetCategories]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.Name,
        c.Description,
        c.Slug,
        c.Icon,
        c.Color,
        c.SortOrder,
        (SELECT COUNT(*) FROM [forum].[ForumPosts] p WHERE p.CategoryID = c.CategoryID AND p.IsDeleted = 0) AS PostCount,
        (SELECT MAX(p.CreatedAt) FROM [forum].[ForumPosts] p WHERE p.CategoryID = c.CategoryID AND p.IsDeleted = 0) AS LastPostAt
    FROM [forum].[ForumCategories] c
    WHERE c.IsActive = 1
    ORDER BY c.SortOrder;
END
GO
