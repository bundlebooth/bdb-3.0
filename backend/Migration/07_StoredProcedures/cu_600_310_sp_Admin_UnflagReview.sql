-- =============================================
-- Stored Procedure: sp_Admin_UnflagReview
-- Description: Removes flag from a review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UnflagReview]'))
    DROP PROCEDURE [dbo].[sp_Admin_UnflagReview];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UnflagReview]
    @ReviewID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Reviews 
    SET IsFlagged = 0, 
        FlagReason = NULL
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
