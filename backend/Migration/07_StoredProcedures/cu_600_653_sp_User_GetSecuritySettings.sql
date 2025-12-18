-- =============================================
-- Stored Procedure: users.sp_GetSecuritySettings
-- Description: Gets 2FA security settings
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetSecuritySettings]'))
    DROP PROCEDURE [users].[sp_GetSecuritySettings];
GO

CREATE PROCEDURE [users].[sp_GetSecuritySettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SettingKey, SettingValue FROM SecuritySettings 
    WHERE SettingKey IN ('require_2fa_admins', 'require_2fa_vendors');
END
GO
