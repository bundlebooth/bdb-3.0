-- =============================================
-- Stored Procedure: admin.sp_AddReviewNote
-- Description: Adds admin note to a review
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_AddReviewNote]'))
    DROP PROCEDURE [admin].[sp_AddReviewNote];
GO

CREATE PROCEDURE [admin].[sp_AddReviewNote]
    @ReviewID INT,
    @AdminNotes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.Reviews 
    SET AdminNotes = @AdminNotes
    WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

