-- =============================================
-- Forum - Soft Delete Post
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('forum.sp_SoftDeletePost', 'P') IS NOT NULL
    DROP PROCEDURE forum.sp_SoftDeletePost;
GO

CREATE PROCEDURE forum.sp_SoftDeletePost
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE forum.ForumPosts 
    SET IsDeleted = 1, UpdatedAt = GETDATE() 
    WHERE PostID = @PostID;
END
GO
