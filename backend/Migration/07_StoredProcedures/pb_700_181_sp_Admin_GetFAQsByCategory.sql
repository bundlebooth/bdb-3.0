/*
    Stored Procedure: sp_GetFAQsByCategory
    Description: Gets FAQs by category slug or all FAQs if no category specified
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFAQsByCategory]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_GetFAQsByCategory]
GO

CREATE PROCEDURE [admin].[sp_GetFAQsByCategory]
    @CategorySlug NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @CategorySlug IS NOT NULL
    BEGIN
        SELECT 
            f.FAQID,
            f.Question,
            f.Answer,
            f.Category,
            f.CategoryID,
            f.DisplayOrder,
            f.IsActive,
            f.ViewCount,
            f.HelpfulCount,
            f.NotHelpfulCount,
            c.Name AS CategoryName,
            c.Slug AS CategorySlug,
            c.Icon AS CategoryIcon
        FROM [admin].[FAQs] f
        LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
        WHERE f.IsActive = 1 
          AND c.Slug = @CategorySlug
        ORDER BY f.DisplayOrder, f.FAQID;
    END
    ELSE
    BEGIN
        SELECT 
            f.FAQID,
            f.Question,
            f.Answer,
            f.Category,
            f.CategoryID,
            f.DisplayOrder,
            f.IsActive,
            f.ViewCount,
            f.HelpfulCount,
            f.NotHelpfulCount,
            c.Name AS CategoryName,
            c.Slug AS CategorySlug,
            c.Icon AS CategoryIcon
        FROM [admin].[FAQs] f
        LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
        WHERE f.IsActive = 1
        ORDER BY f.CategoryID, f.DisplayOrder, f.FAQID;
    END
END
GO
