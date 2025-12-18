-- =============================================
-- Stored Procedure: sp_Admin_GetNotificationRecipients
-- Description: Gets email recipients based on recipient type
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetNotificationRecipients]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetNotificationRecipients];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetNotificationRecipients]
    @RecipientType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @RecipientType = 'all'
    BEGIN
        SELECT Email FROM Users WHERE IsActive = 1;
    END
    ELSE IF @RecipientType = 'vendors'
    BEGIN
        SELECT u.Email FROM Users u WHERE u.IsVendor = 1 AND u.IsActive = 1;
    END
    ELSE IF @RecipientType = 'clients'
    BEGIN
        SELECT u.Email FROM Users u WHERE u.IsVendor = 0 AND u.IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT NULL as Email WHERE 1=0;
    END
END
GO
