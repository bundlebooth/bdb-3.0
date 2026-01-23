-- =============================================
-- Forum - Decrement Comment Count
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('forum.sp_DecrementCommentCount', 'P') IS NOT NULL
    DROP PROCEDURE forum.sp_DecrementCommentCount;
GO

CREATE PROCEDURE forum.sp_DecrementCommentCount
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE forum.ForumPosts 
    SET CommentCount = CommentCount - 1 
    WHERE PostID = @PostID;
END
GO
