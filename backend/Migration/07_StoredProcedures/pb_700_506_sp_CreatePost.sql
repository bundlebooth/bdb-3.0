/*
    Migration Script: Create Stored Procedure [forum].[sp_CreatePost]
    Description: Creates the [forum].[sp_CreatePost] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[forum].[sp_CreatePost]'))
    DROP PROCEDURE [forum].[sp_CreatePost];
GO

-- =============================================
-- Stored Procedure: forum.sp_CreatePost
-- Description: Create a new forum post
-- =============================================

CREATE   PROCEDURE [forum].[sp_CreatePost]
    @CategoryID INT,
    @AuthorID INT,
    @Title NVARCHAR(300),
    @Content NVARCHAR(MAX),
    @ImageURL NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Generate slug from title
    DECLARE @Slug NVARCHAR(350);
    DECLARE @BaseSlug NVARCHAR(300);
    DECLARE @Counter INT = 0;
    
    -- Create base slug (lowercase, replace spaces with hyphens, remove special chars)
    SET @BaseSlug = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Title, ' ', '-'), '''', ''), '"', ''), '?', ''), '!', ''));
    SET @BaseSlug = LEFT(@BaseSlug, 250);
    
    -- Check for uniqueness and add counter if needed
    SET @Slug = @BaseSlug;
    WHILE EXISTS (SELECT 1 FROM [forum].[ForumPosts] WHERE Slug = @Slug)
    BEGIN
        SET @Counter = @Counter + 1;
        SET @Slug = @BaseSlug + '-' + CAST(@Counter AS NVARCHAR(10));
    END
    
    -- Insert the post
    INSERT INTO [forum].[ForumPosts] (
        CategoryID, AuthorID, Title, Content, Slug, ImageURL
    )
    VALUES (
        @CategoryID, @AuthorID, @Title, @Content, @Slug, @ImageURL
    );
    
    -- Return the created post
    DECLARE @PostID INT = SCOPE_IDENTITY();
    
    SELECT 
        p.PostID,
        p.CategoryID,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug,
        p.AuthorID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS AuthorName,
        u.ProfileImageURL AS AuthorAvatar,
        p.Title,
        p.Content,
        p.Slug,
        p.ImageURL,
        p.ViewCount,
        p.CommentCount,
        p.UpvoteCount,
        p.DownvoteCount,
        p.IsPinned,
        p.IsLocked,
        p.CreatedAt
    FROM [forum].[ForumPosts] p
    JOIN [forum].[ForumCategories] c ON p.CategoryID = c.CategoryID
    JOIN [users].[Users] u ON p.AuthorID = u.UserID
    WHERE p.PostID = @PostID;
END
GO
