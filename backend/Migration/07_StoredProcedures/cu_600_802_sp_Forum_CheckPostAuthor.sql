-- =============================================
-- Forum - Check Post Author
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('forum.sp_CheckPostAuthor', 'P') IS NOT NULL
    DROP PROCEDURE forum.sp_CheckPostAuthor;
GO

CREATE PROCEDURE forum.sp_CheckPostAuthor
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AuthorID 
    FROM forum.ForumPosts 
    WHERE PostID = @PostID;
END
GO
