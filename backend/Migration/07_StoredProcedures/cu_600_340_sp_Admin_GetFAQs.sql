-- =============================================
-- Stored Procedure: sp_Admin_GetFAQs
-- Description: Gets all platform FAQs
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetFAQs]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetFAQs];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetFAQs]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PlatformFAQs')
    BEGIN
        SELECT * FROM PlatformFAQs ORDER BY DisplayOrder, CreatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT NULL as FAQID WHERE 1=0;
    END
END
GO
