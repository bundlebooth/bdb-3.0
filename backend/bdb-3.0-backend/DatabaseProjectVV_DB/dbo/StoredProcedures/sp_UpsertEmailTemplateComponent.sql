
-- Create or update email template component
CREATE   PROCEDURE sp_UpsertEmailTemplateComponent
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

