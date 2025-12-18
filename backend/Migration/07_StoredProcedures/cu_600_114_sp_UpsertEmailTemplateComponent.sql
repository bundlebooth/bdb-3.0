/*
    Migration Script: Create Stored Procedure [sp_UpsertEmailTemplateComponent]
    Phase: 600 - Stored Procedures
    Script: cu_600_114_dbo.sp_UpsertEmailTemplateComponent.sql
    Description: Creates the [admin].[sp_UpsertEmailTemplateComponent] stored procedure
    
    Execution Order: 114
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_UpsertEmailTemplateComponent]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpsertEmailTemplateComponent]'))
    DROP PROCEDURE [admin].[sp_UpsertEmailTemplateComponent];
GO

CREATE   PROCEDURE [admin].[sp_UpsertEmailTemplateComponent]
    @ComponentID INT = NULL, @ComponentType NVARCHAR(20), @ComponentName NVARCHAR(100),
    @HtmlContent NVARCHAR(MAX), @TextContent NVARCHAR(MAX) = NULL, @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @ComponentID IS NULL
    BEGIN
        INSERT INTO EmailTemplateComponents (ComponentType, ComponentName, HtmlContent, TextContent, Description)
        VALUES (@ComponentType, @ComponentName, @HtmlContent, @TextContent, @Description);
        SELECT SCOPE_IDENTITY() AS ComponentID;
    END
    ELSE
    BEGIN
        UPDATE EmailTemplateComponents SET ComponentType = @ComponentType, ComponentName = @ComponentName,
               HtmlContent = @HtmlContent, TextContent = @TextContent, Description = @Description, UpdatedAt = GETDATE()
        WHERE ComponentID = @ComponentID;
        SELECT @ComponentID AS ComponentID;
    END
END

GO

PRINT 'Stored procedure [admin].[sp_UpsertEmailTemplateComponent] created successfully.';
GO
