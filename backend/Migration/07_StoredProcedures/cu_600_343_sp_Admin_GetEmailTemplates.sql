-- =============================================
-- Stored Procedure: admin.sp_GetEmailTemplates
-- Description: Gets all email templates with components
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailTemplates]'))
    DROP PROCEDURE [admin].[sp_GetEmailTemplates];
GO

CREATE PROCEDURE [admin].[sp_GetEmailTemplates]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TemplateID as id,
        t.TemplateName as name,
        t.TemplateKey as templateKey,
        t.Category as category,
        t.Subject as subject,
        t.AvailableVariables as variables,
        t.IsActive as isActive,
        t.CreatedAt,
        t.UpdatedAt,
        'email' as type,
        COALESCE(h.HtmlContent, '') + COALESCE(b.HtmlContent, '') + COALESCE(f.HtmlContent, '') as body,
        h.HtmlContent as headerHtml,
        b.HtmlContent as bodyHtml,
        f.HtmlContent as footerHtml
    FROM EmailTemplates t
    LEFT JOIN EmailTemplateComponents h ON t.HeaderComponentID = h.ComponentID
    LEFT JOIN EmailTemplateComponents b ON t.BodyComponentID = b.ComponentID
    LEFT JOIN EmailTemplateComponents f ON t.FooterComponentID = f.ComponentID
    ORDER BY t.Category, t.TemplateName;
END
GO
