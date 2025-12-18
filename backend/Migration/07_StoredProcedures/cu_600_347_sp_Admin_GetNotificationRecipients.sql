-- =============================================
-- Stored Procedure: admin.sp_GetNotificationRecipients
-- Description: Gets email recipients based on recipient type
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetNotificationRecipients]'))
    DROP PROCEDURE [admin].[sp_GetNotificationRecipients];
GO

CREATE PROCEDURE [admin].[sp_GetNotificationRecipients]
    @RecipientType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @RecipientType = 'all'
    BEGIN
        SELECT Email FROM users.Users WHERE IsActive = 1;
    END
    ELSE IF @RecipientType = 'vendors'
    BEGIN
        SELECT u.Email FROM users.Users u WHERE u.IsVendor = 1 AND u.IsActive = 1;
    END
    ELSE IF @RecipientType = 'clients'
    BEGIN
        SELECT u.Email FROM users.Users u WHERE u.IsVendor = 0 AND u.IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT NULL as Email WHERE 1=0;
    END
END
GO

