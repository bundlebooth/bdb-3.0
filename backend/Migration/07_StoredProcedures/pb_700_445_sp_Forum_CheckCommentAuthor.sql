-- =============================================
-- Forum - Check Comment Author
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('forum.sp_CheckCommentAuthor', 'P') IS NOT NULL
    DROP PROCEDURE forum.sp_CheckCommentAuthor;
GO

CREATE PROCEDURE forum.sp_CheckCommentAuthor
    @CommentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AuthorID, PostID 
    FROM forum.ForumComments 
    WHERE CommentID = @CommentID;
END
GO
