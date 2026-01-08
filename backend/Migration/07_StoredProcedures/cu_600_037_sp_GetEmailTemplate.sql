/*
    Migration Script: Create Stored Procedure [sp_GetEmailTemplate]
    Phase: 600 - Stored Procedures
    Script: cu_600_037_dbo.sp_GetEmailTemplate.sql
    Description: Creates the [admin].[sp_GetEmailTemplate] stored procedure
    
    Execution Order: 37
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetEmailTemplate]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEmailTemplate]'))
    DROP PROCEDURE [admin].[sp_GetEmailTemplate];
GO

CREATE   PROCEDURE [admin].[sp_GetEmailTemplate]
    @TemplateKey NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.TemplateID, t.TemplateKey, t.TemplateName, t.Subject, t.Category, t.AvailableVariables,
           h.HtmlContent AS HeaderHtml, h.TextContent AS HeaderText,
           b.HtmlContent AS BodyHtml, b.TextContent AS BodyText,
           f.HtmlContent AS FooterHtml, f.TextContent AS FooterText
    FROM EmailTemplates t
    LEFT JOIN EmailTemplateComponents h ON t.HeaderComponentID = h.ComponentID
    INNER JOIN EmailTemplateComponents b ON t.BodyComponentID = b.ComponentID
    LEFT JOIN EmailTemplateComponents f ON t.FooterComponentID = f.ComponentID
    WHERE t.TemplateKey = @TemplateKey AND t.IsActive = 1 AND b.IsActive = 1
      AND (h.IsActive = 1 OR h.ComponentID IS NULL) AND (f.IsActive = 1 OR f.ComponentID IS NULL);
END

GO

PRINT 'Stored procedure [admin].[sp_GetEmailTemplate] created successfully.';
GO
