-- =============================================
-- Stored Procedure: sp_Admin_DeleteReview
-- Description: Deletes a review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteReview]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteReview];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteReview]
    @ReviewID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Reviews WHERE ReviewID = @ReviewID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
