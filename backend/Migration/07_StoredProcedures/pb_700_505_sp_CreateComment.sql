/*
    Migration Script: Create Stored Procedure [forum].[sp_CreateComment]
    Description: Creates the [forum].[sp_CreateComment] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[forum].[sp_CreateComment]'))
    DROP PROCEDURE [forum].[sp_CreateComment];
GO

-- =============================================
-- Stored Procedure: forum.sp_CreateComment
-- Description: Create a new comment on a forum post
-- =============================================

CREATE   PROCEDURE [forum].[sp_CreateComment]
    @PostID INT,
    @AuthorID INT,
    @Content NVARCHAR(MAX),
    @ParentCommentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if post exists and is not locked
    IF NOT EXISTS (SELECT 1 FROM [forum].[ForumPosts] WHERE PostID = @PostID AND IsDeleted = 0 AND IsLocked = 0)
    BEGIN
        RAISERROR('Post not found or is locked', 16, 1);
        RETURN;
    END
    
    -- Insert the comment
    INSERT INTO [forum].[ForumComments] (
        PostID, ParentCommentID, AuthorID, Content
    )
    VALUES (
        @PostID, @ParentCommentID, @AuthorID, @Content
    );
    
    DECLARE @CommentID INT = SCOPE_IDENTITY();
    
    -- Update comment count on post
    UPDATE [forum].[ForumPosts]
    SET CommentCount = CommentCount + 1,
        UpdatedAt = GETDATE()
    WHERE PostID = @PostID;
    
    -- Return the created comment
    SELECT 
        c.CommentID,
        c.PostID,
        c.ParentCommentID,
        c.AuthorID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS AuthorName,
        u.ProfileImageURL AS AuthorAvatar,
        c.Content,
        c.UpvoteCount,
        c.DownvoteCount,
        (c.UpvoteCount - c.DownvoteCount) AS Score,
        c.CreatedAt
    FROM [forum].[ForumComments] c
    JOIN [users].[Users] u ON c.AuthorID = u.UserID
    WHERE c.CommentID = @CommentID;
END
GO
