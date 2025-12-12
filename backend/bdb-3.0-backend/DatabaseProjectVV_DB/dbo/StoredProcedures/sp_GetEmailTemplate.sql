
-- =============================================
-- EMAIL TEMPLATE SYSTEM - STORED PROCEDURES
-- =============================================

-- Get complete email template with merged components
CREATE   PROCEDURE sp_GetEmailTemplate
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

