/*
    Migration Script: Create Stored Procedure [forum].[sp_GetCategories]
    Description: Creates the [forum].[sp_GetCategories] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[forum].[sp_GetCategories]'))
    DROP PROCEDURE [forum].[sp_GetCategories];
GO

-- =============================================
-- Stored Procedure: forum.sp_GetCategories
-- Description: Get all forum categories with post counts
-- =============================================

CREATE   PROCEDURE [forum].[sp_GetCategories]
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
