-- =============================================
-- Stored Procedure: admin.sp_DeleteReview
-- Description: Deletes a review
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteReview]'))
    DROP PROCEDURE [admin].[sp_DeleteReview];
GO

CREATE PROCEDURE [admin].[sp_DeleteReview]
    @ReviewID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.Reviews WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

