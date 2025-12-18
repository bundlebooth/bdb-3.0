-- =============================================
-- Stored Procedure: admin.sp_DeleteFAQ
-- Description: Deletes a platform FAQ
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteFAQ]'))
    DROP PROCEDURE [admin].[sp_DeleteFAQ];
GO

CREATE PROCEDURE [admin].[sp_DeleteFAQ]
    @FAQID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM PlatformFAQs WHERE FAQID = @FAQID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
