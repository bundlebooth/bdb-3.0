-- =============================================
-- Stored Procedure: admin.sp_GetEmailTemplates
-- Description: Gets all email templates
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailTemplates]'))
    DROP PROCEDURE [admin].[sp_GetEmailTemplates];
GO

CREATE PROCEDURE [admin].[sp_GetEmailTemplates]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        TemplateID,
        TemplateName,
        TemplateKey,
        Subject,
        HtmlContent,
        TextContent,
        Category,
        Variables,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM admin.EmailTemplates
    WHERE (@Category IS NULL OR Category = @Category)
    ORDER BY Category, TemplateName;
END
GO

