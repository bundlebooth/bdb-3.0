-- =============================================
-- Stored Procedure: admin.sp_GetFAQs
-- Description: Gets all platform FAQs
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFAQs]'))
    DROP PROCEDURE [admin].[sp_GetFAQs];
GO

CREATE PROCEDURE [admin].[sp_GetFAQs]
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
