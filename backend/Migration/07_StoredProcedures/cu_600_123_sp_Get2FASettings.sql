-- =============================================
-- Stored Procedure: users.sp_Get2FASettings
-- Description: Gets two-factor authentication settings
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Get2FASettings]'))
    DROP PROCEDURE [users].[sp_Get2FASettings];
GO

CREATE PROCEDURE [users].[sp_Get2FASettings]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SettingKey, SettingValue FROM SecuritySettings 
    WHERE SettingKey IN ('require_2fa_admins', 'require_2fa_vendors');
END
GO
