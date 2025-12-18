-- =============================================
-- Stored Procedure: sp_Admin_DeleteFAQ
-- Description: Deletes a platform FAQ
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteFAQ]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteFAQ];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteFAQ]
    @FAQID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM PlatformFAQs WHERE FAQID = @FAQID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
