-- =============================================
-- Stored Procedure: admin.sp_CheckEmailCooldown
-- Description: Check if an email was recently sent (for cooldown)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_CheckEmailCooldown]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [admin].[sp_CheckEmailCooldown]
GO

CREATE PROCEDURE [admin].[sp_CheckEmailCooldown]
    @TemplateKey NVARCHAR(50),
    @RecipientEmail NVARCHAR(255),
    @CooldownMinutes INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 SentAt 
    FROM admin.EmailLogs 
    WHERE TemplateKey = @TemplateKey 
      AND RecipientEmail = @RecipientEmail 
      AND Status = 'sent'
      AND SentAt > DATEADD(MINUTE, -@CooldownMinutes, GETDATE())
    ORDER BY SentAt DESC
END
GO
