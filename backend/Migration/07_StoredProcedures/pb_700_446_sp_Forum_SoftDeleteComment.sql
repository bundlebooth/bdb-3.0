-- =============================================
-- Forum - Soft Delete Comment
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('forum.sp_SoftDeleteComment', 'P') IS NOT NULL
    DROP PROCEDURE forum.sp_SoftDeleteComment;
GO

CREATE PROCEDURE forum.sp_SoftDeleteComment
    @CommentID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE forum.ForumComments 
    SET IsDeleted = 1, UpdatedAt = GETDATE() 
    WHERE CommentID = @CommentID;
END
GO
