-- =============================================
-- Stored Procedure: sp_Admin_UpdateEmailTemplate
-- Description: Updates an email template and its body component
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateEmailTemplate]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateEmailTemplate];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateEmailTemplate]
    @TemplateID INT,
    @Subject NVARCHAR(500) = NULL,
    @BodyHtml NVARCHAR(MAX) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BodyComponentID INT;
    
    -- Get the body component ID
    SELECT @BodyComponentID = BodyComponentID FROM EmailTemplates WHERE TemplateID = @TemplateID;
    
    -- Update the template subject and active status
    UPDATE EmailTemplates 
    SET Subject = COALESCE(@Subject, Subject), 
        IsActive = COALESCE(@IsActive, IsActive), 
        UpdatedAt = GETUTCDATE()
    WHERE TemplateID = @TemplateID;
    
    -- Update the body component HTML if provided
    IF @BodyHtml IS NOT NULL AND @BodyComponentID IS NOT NULL
    BEGIN
        UPDATE EmailTemplateComponents 
        SET HtmlContent = @BodyHtml, UpdatedAt = GETUTCDATE()
        WHERE ComponentID = @BodyComponentID;
    END
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
