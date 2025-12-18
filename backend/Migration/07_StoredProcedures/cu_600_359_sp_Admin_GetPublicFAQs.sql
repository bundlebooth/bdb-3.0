-- =============================================
-- Stored Procedure: sp_Admin_GetPublicFAQs
-- Description: Gets FAQs for public display
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPublicFAQs]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPublicFAQs];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPublicFAQs]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FAQs')
    BEGIN
        SELECT FAQID, Question, Answer, Category, DisplayOrder, IsActive, CreatedAt, UpdatedAt
        FROM FAQs
        ORDER BY DisplayOrder, CreatedAt;
    END
    ELSE
    BEGIN
        SELECT NULL as FAQID WHERE 1=0;
    END
END
GO
