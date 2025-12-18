-- =============================================
-- Stored Procedure: admin.sp_GetPublicFAQs
-- Description: Gets FAQs for public display
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicFAQs]'))
    DROP PROCEDURE [admin].[sp_GetPublicFAQs];
GO

CREATE PROCEDURE [admin].[sp_GetPublicFAQs]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'FAQs' AND s.name = 'admin')
    BEGIN
        SELECT FAQID, Question, Answer, Category, DisplayOrder, IsActive, CreatedAt, UpdatedAt
        FROM admin.FAQs
        ORDER BY DisplayOrder, CreatedAt;
    END
    ELSE
    BEGIN
        SELECT NULL as FAQID WHERE 1=0;
    END
END
GO
