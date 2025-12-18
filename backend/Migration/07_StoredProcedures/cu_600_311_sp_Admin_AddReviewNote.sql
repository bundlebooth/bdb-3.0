-- =============================================
-- Stored Procedure: sp_Admin_AddReviewNote
-- Description: Adds admin note to a review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_AddReviewNote]'))
    DROP PROCEDURE [dbo].[sp_Admin_AddReviewNote];
GO

CREATE PROCEDURE [dbo].[sp_Admin_AddReviewNote]
    @ReviewID INT,
    @AdminNotes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Reviews 
    SET AdminNotes = @AdminNotes
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
