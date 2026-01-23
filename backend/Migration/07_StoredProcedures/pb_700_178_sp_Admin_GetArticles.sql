/*
    Stored Procedure: sp_GetArticles
    Description: Gets articles with optional filtering by type and category
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetArticles]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_GetArticles]
GO

CREATE PROCEDURE [admin].[sp_GetArticles]
    @ArticleType NVARCHAR(50) = NULL,
    @CategoryID INT = NULL,
    @IsFeatured BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.ArticleID,
        a.Title,
        a.Slug,
        a.Summary,
        a.Content,
        a.CategoryID,
        a.ArticleType,
        a.FeaturedImage,
        a.Author,
        a.Tags,
        a.DisplayOrder,
        a.IsActive,
        a.IsFeatured,
        a.ViewCount,
        a.HelpfulCount,
        a.NotHelpfulCount,
        a.PublishedAt,
        a.CreatedAt,
        a.UpdatedAt,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug
    FROM [admin].[Articles] a
    LEFT JOIN [admin].[FAQCategories] c ON a.CategoryID = c.CategoryID
    WHERE a.IsActive = 1
      AND (@ArticleType IS NULL OR a.ArticleType = @ArticleType)
      AND (@CategoryID IS NULL OR a.CategoryID = @CategoryID)
      AND (@IsFeatured IS NULL OR a.IsFeatured = @IsFeatured)
    ORDER BY a.IsFeatured DESC, a.DisplayOrder, a.PublishedAt DESC;
END
GO
