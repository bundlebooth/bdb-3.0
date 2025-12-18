-- =============================================
-- Stored Procedure: sp_User_GetSecuritySettings
-- Description: Gets 2FA security settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetSecuritySettings]'))
    DROP PROCEDURE [dbo].[sp_User_GetSecuritySettings];
GO

CREATE PROCEDURE [dbo].[sp_User_GetSecuritySettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SettingKey, SettingValue FROM SecuritySettings 
    WHERE SettingKey IN ('require_2fa_admins', 'require_2fa_vendors');
END
GO
