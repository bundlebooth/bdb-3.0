-- =============================================
-- Stored Procedure: admin.sp_GetEmailTemplate
-- Description: Gets a single email template with full HTML
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailTemplate]'))
    DROP PROCEDURE [admin].[sp_GetEmailTemplate];
GO

CREATE PROCEDURE [admin].[sp_GetEmailTemplate]
    @TemplateID INT
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
        h.HtmlContent as headerHtml,
        b.HtmlContent as bodyHtml,
        f.HtmlContent as footerHtml,
        h.ComponentID as headerComponentId,
        b.ComponentID as bodyComponentId,
        f.ComponentID as footerComponentId
    FROM EmailTemplates t
    LEFT JOIN EmailTemplateComponents h ON t.HeaderComponentID = h.ComponentID
    LEFT JOIN EmailTemplateComponents b ON t.BodyComponentID = b.ComponentID
    LEFT JOIN EmailTemplateComponents f ON t.FooterComponentID = f.ComponentID
    WHERE t.TemplateID = @TemplateID;
END
GO
