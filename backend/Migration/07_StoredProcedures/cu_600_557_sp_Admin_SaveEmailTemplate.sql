-- =============================================
-- Stored Procedure: admin.sp_SaveEmailTemplate
-- Description: Creates or updates an email template
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SaveEmailTemplate]'))
    DROP PROCEDURE [admin].[sp_SaveEmailTemplate];
GO

CREATE PROCEDURE [admin].[sp_SaveEmailTemplate]
    @TemplateID INT = NULL,
    @TemplateName NVARCHAR(100),
    @TemplateKey NVARCHAR(50),
    @Subject NVARCHAR(255),
    @HtmlContent NVARCHAR(MAX),
    @TextContent NVARCHAR(MAX) = NULL,
    @Category NVARCHAR(50) = 'General',
    @Variables NVARCHAR(MAX) = NULL,
    @IsActive BIT = 1,
    @CreatedBy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @TemplateID IS NOT NULL AND EXISTS (SELECT 1 FROM admin.EmailTemplates WHERE TemplateID = @TemplateID)
    BEGIN
        UPDATE admin.EmailTemplates
        SET TemplateName = @TemplateName,
            TemplateKey = @TemplateKey,
            Subject = @Subject,
            HtmlContent = @HtmlContent,
            TextContent = @TextContent,
            Category = @Category,
            Variables = @Variables,
            IsActive = @IsActive,
            UpdatedAt = GETDATE()
        WHERE TemplateID = @TemplateID;
        
        SELECT @TemplateID AS TemplateID;
    END
    ELSE
    BEGIN
        INSERT INTO admin.EmailTemplates 
            (TemplateName, TemplateKey, Subject, HtmlContent, TextContent, Category, Variables, IsActive, CreatedBy)
        VALUES 
            (@TemplateName, @TemplateKey, @Subject, @HtmlContent, @TextContent, @Category, @Variables, @IsActive, @CreatedBy);
        
        SELECT SCOPE_IDENTITY() AS TemplateID;
    END
END
GO

