-- =============================================
-- Stored Procedure: admin.sp_GetEmailTemplates
-- Description: Gets all email templates with their component details
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
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TemplateID,
        t.TemplateKey,
        t.TemplateName,
        t.Subject,
        t.Category,
        t.AvailableVariables,
        t.IsActive,
        t.CreatedAt,
        t.UpdatedAt,
        t.HeaderComponentID,
        t.BodyComponentID,
        t.FooterComponentID,
        hc.HtmlContent AS HeaderContent,
        bc.HtmlContent AS BodyContent,
        fc.HtmlContent AS FooterContent
    FROM admin.EmailTemplates t
    LEFT JOIN admin.EmailTemplateComponents hc ON t.HeaderComponentID = hc.ComponentID
    LEFT JOIN admin.EmailTemplateComponents bc ON t.BodyComponentID = bc.ComponentID
    LEFT JOIN admin.EmailTemplateComponents fc ON t.FooterComponentID = fc.ComponentID
    ORDER BY t.Category, t.TemplateName;
END
GO
