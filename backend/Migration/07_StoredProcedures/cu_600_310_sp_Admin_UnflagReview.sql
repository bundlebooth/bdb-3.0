-- =============================================
-- Stored Procedure: admin.sp_UnflagReview
-- Description: Removes flag from a review
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UnflagReview]'))
    DROP PROCEDURE [admin].[sp_UnflagReview];
GO

CREATE PROCEDURE [admin].[sp_UnflagReview]
    @ReviewID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.Reviews 
    SET IsFlagged = 0, 
        FlagReason = NULL
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

