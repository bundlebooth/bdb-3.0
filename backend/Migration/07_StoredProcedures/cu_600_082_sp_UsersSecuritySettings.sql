/*
    Migration Script: Create Stored Procedure for Security Settings Check
    Phase: 600 - Stored Procedures
    Script: cu_600_082_sp_UsersSecuritySettings.sql
    Description: Creates stored procedure for checking security settings with table existence check
    Schema: users
    Execution Order: 82
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_CheckSecuritySettings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_CheckSecuritySettings]'))
    DROP PROCEDURE [users].[sp_CheckSecuritySettings];
GO

CREATE PROCEDURE [users].[sp_CheckSecuritySettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if table exists and return settings
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'SecuritySettings' AND s.name = 'users')
    BEGIN
        SELECT SettingKey, SettingValue FROM users.SecuritySettings;
    END
    ELSE IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecuritySettings')
    BEGIN
        -- Try dbo schema
        SELECT 'require_2fa_admins' AS SettingKey, CAST(Require2FAForAdmins AS NVARCHAR(10)) AS SettingValue FROM dbo.SecuritySettings
        UNION ALL
        SELECT 'require_2fa_vendors' AS SettingKey, CAST(Require2FAForVendors AS NVARCHAR(10)) AS SettingValue FROM dbo.SecuritySettings;
    END
    -- If table doesn't exist, return empty result set
END
GO

PRINT 'Stored procedure [users].[sp_CheckSecuritySettings] created successfully.';
GO
