-- =============================================
-- Stored Procedure: admin.sp_Get2FASettings
-- Description: Gets 2FA security settings
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Get2FASettings]'))
    DROP PROCEDURE [admin].[sp_Get2FASettings];
GO

CREATE PROCEDURE [admin].[sp_Get2FASettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecuritySettings')
    BEGIN
        SELECT SettingKey, SettingValue FROM SecuritySettings WHERE IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT NULL as SettingKey, NULL as SettingValue WHERE 1=0;
    END
END
GO
