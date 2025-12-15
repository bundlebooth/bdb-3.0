-- =============================================
-- Stored Procedure: sp_Get2FASettings
-- Description: Gets two-factor authentication settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Get2FASettings]'))
    DROP PROCEDURE [dbo].[sp_Get2FASettings];
GO

CREATE PROCEDURE [dbo].[sp_Get2FASettings]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SettingKey, SettingValue FROM SecuritySettings 
    WHERE SettingKey IN ('require_2fa_admins', 'require_2fa_vendors');
END
GO
