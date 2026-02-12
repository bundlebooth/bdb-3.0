/*
    Migration Script: Stored Procedure - Get Email Template By Key
    Phase: 700 - Stored Procedures
    Script: pb_700_371_sp_EmailTemplate_GetByKey.sql
    Description: Gets email template with components by template key.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_EmailTemplate_GetByKey]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_EmailTemplate_GetByKey];
GO

CREATE PROCEDURE [admin].[sp_EmailTemplate_GetByKey]
    @TemplateKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        t.TemplateKey, 
        t.TemplateName, 
        t.Subject,
        h.HtmlContent as HeaderHtml, 
        h.TextContent as HeaderText,
        b.HtmlContent as BodyHtml, 
        b.TextContent as BodyText,
        f.HtmlContent as FooterHtml, 
        f.TextContent as FooterText
    FROM [admin].[EmailTemplates] t
    LEFT JOIN [admin].[EmailTemplateComponents] h ON t.HeaderComponentID = h.ComponentID
    LEFT JOIN [admin].[EmailTemplateComponents] b ON t.BodyComponentID = b.ComponentID
    LEFT JOIN [admin].[EmailTemplateComponents] f ON t.FooterComponentID = f.ComponentID
    WHERE t.TemplateKey = @TemplateKey AND t.IsActive = 1;
END
GO

PRINT 'Created stored procedure: [admin].[sp_EmailTemplate_GetByKey]';
GO
