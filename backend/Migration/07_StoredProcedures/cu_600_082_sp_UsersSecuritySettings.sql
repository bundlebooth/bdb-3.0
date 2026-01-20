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

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_CheckSecuritySettings]'))
    DROP PROCEDURE [users].[sp_CheckSecuritySettings];
GO

CREATE PROCEDURE [users].[sp_CheckSecuritySettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use dbo.SecuritySettings with column-based format
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'SecuritySettings' AND s.name = 'dbo')
      AND EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'SecuritySettings' AND COLUMN_NAME = 'Require2FAForAdmins')
    BEGIN
      EXEC sp_executesql N'
        SELECT ''require_2fa_admins'' AS SettingKey, CASE WHEN Require2FAForAdmins = 1 THEN ''true'' ELSE ''false'' END AS SettingValue FROM dbo.SecuritySettings
        UNION ALL
        SELECT ''require_2fa_vendors'', CASE WHEN Require2FAForVendors = 1 THEN ''true'' ELSE ''false'' END FROM dbo.SecuritySettings
        UNION ALL
        SELECT ''session_timeout_minutes'', CAST(ISNULL(SessionTimeout, 60) AS NVARCHAR(10)) FROM dbo.SecuritySettings
        UNION ALL
        SELECT ''failed_login_lockout'', CAST(ISNULL(FailedLoginLockout, 5) AS NVARCHAR(10)) FROM dbo.SecuritySettings
      ';
    END
END
GO

PRINT 'Stored procedure [users].[sp_CheckSecuritySettings] created successfully.';
GO
