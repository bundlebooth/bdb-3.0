-- =============================================
-- Stored Procedure: users.sp_Get2FASettings
-- Description: Gets 2FA settings from SecuritySettings table
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
    
    -- Check if table exists
    IF OBJECT_ID('dbo.SecuritySettings', 'U') IS NOT NULL
    BEGIN
        SELECT SettingKey, SettingValue FROM SecuritySettings 
        WHERE SettingKey IN ('require_2fa_admins', 'require_2fa_vendors');
    END
END
GO
