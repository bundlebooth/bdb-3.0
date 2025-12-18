-- =============================================
-- Stored Procedure: sp_Admin_FlagReview
-- Description: Flags or unflags a review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_FlagReview]'))
    DROP PROCEDURE [dbo].[sp_Admin_FlagReview];
GO

CREATE PROCEDURE [dbo].[sp_Admin_FlagReview]
    @ReviewID INT,
    @IsFlagged BIT,
    @FlagReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Reviews 
    SET IsFlagged = @IsFlagged, 
        FlagReason = @FlagReason
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
