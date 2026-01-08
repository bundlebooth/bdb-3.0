-- =============================================
-- Stored Procedure: admin.sp_FlagReview
-- Description: Flags or unflags a review
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_FlagReview]'))
    DROP PROCEDURE [admin].[sp_FlagReview];
GO

CREATE PROCEDURE [admin].[sp_FlagReview]
    @ReviewID INT,
    @IsFlagged BIT,
    @FlagReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.Reviews 
    SET IsFlagged = @IsFlagged, 
        FlagReason = @FlagReason
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

