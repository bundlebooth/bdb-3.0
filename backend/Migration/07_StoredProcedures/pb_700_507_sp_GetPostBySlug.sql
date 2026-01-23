/*
    Migration Script: Create Stored Procedure [forum].[sp_GetPostBySlug]
    Description: Creates the [forum].[sp_GetPostBySlug] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[forum].[sp_GetPostBySlug]'))
    DROP PROCEDURE [forum].[sp_GetPostBySlug];
GO

-- =============================================
-- Stored Procedure: forum.sp_GetPostBySlug
-- Description: Get a single forum post by slug with comments
-- =============================================

CREATE   PROCEDURE [forum].[sp_GetPostBySlug]
    @Slug NVARCHAR(350),
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Increment view count
    UPDATE [forum].[ForumPosts]
    SET ViewCount = ViewCount + 1
    WHERE Slug = @Slug AND IsDeleted = 0;
    
    -- Get post details
    SELECT 
        p.PostID,
        p.CategoryID,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug,
        c.Icon AS CategoryIcon,
        c.Color AS CategoryColor,
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
        (p.UpvoteCount - p.DownvoteCount) AS Score,
        p.IsPinned,
        p.IsLocked,
        p.CreatedAt,
        p.UpdatedAt,
        CASE WHEN @UserID IS NOT NULL THEN 
            (SELECT VoteType FROM [forum].[ForumVotes] v WHERE v.UserID = @UserID AND v.PostID = p.PostID)
        ELSE NULL END AS UserVote
    FROM [forum].[ForumPosts] p
    JOIN [forum].[ForumCategories] c ON p.CategoryID = c.CategoryID
    JOIN [users].[Users] u ON p.AuthorID = u.UserID
    WHERE p.Slug = @Slug AND p.IsDeleted = 0;
    
    -- Get comments (hierarchical)
    ;WITH CommentTree AS (
        SELECT 
            cm.CommentID,
            cm.PostID,
            cm.ParentCommentID,
            cm.AuthorID,
            CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS AuthorName,
            u.ProfileImageURL AS AuthorAvatar,
            cm.Content,
            cm.UpvoteCount,
            cm.DownvoteCount,
            (cm.UpvoteCount - cm.DownvoteCount) AS Score,
            cm.IsDeleted,
            cm.CreatedAt,
            cm.UpdatedAt,
            0 AS Level,
            CAST(RIGHT('0000000000' + CAST(cm.CommentID AS VARCHAR(10)), 10) AS VARCHAR(MAX)) AS SortPath
        FROM [forum].[ForumComments] cm
        JOIN [users].[Users] u ON cm.AuthorID = u.UserID
        JOIN [forum].[ForumPosts] p ON cm.PostID = p.PostID
        WHERE p.Slug = @Slug AND cm.ParentCommentID IS NULL
        
        UNION ALL
        
        SELECT 
            cm.CommentID,
            cm.PostID,
            cm.ParentCommentID,
            cm.AuthorID,
            CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS AuthorName,
            u.ProfileImageURL AS AuthorAvatar,
            cm.Content,
            cm.UpvoteCount,
            cm.DownvoteCount,
            (cm.UpvoteCount - cm.DownvoteCount) AS Score,
            cm.IsDeleted,
            cm.CreatedAt,
            cm.UpdatedAt,
            ct.Level + 1,
            ct.SortPath + '/' + RIGHT('0000000000' + CAST(cm.CommentID AS VARCHAR(10)), 10)
        FROM [forum].[ForumComments] cm
        JOIN [users].[Users] u ON cm.AuthorID = u.UserID
        JOIN CommentTree ct ON cm.ParentCommentID = ct.CommentID
    )
    SELECT 
        ct.*,
        CASE WHEN @UserID IS NOT NULL THEN 
            (SELECT VoteType FROM [forum].[ForumVotes] v WHERE v.UserID = @UserID AND v.CommentID = ct.CommentID)
        ELSE NULL END AS UserVote
    FROM CommentTree ct
    ORDER BY ct.SortPath;
END
GO
