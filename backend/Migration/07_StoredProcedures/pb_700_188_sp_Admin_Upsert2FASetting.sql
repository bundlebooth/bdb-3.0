-- =============================================
-- Stored Procedure: admin.sp_Upsert2FASetting
-- Description: Creates or updates a 2FA security setting
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Upsert2FASetting]'))
    DROP PROCEDURE [admin].[sp_Upsert2FASetting];
GO

CREATE PROCEDURE [admin].[sp_Upsert2FASetting]
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update dbo.SecuritySettings column-based table
    IF @SettingKey = 'require_2fa_admins'
      UPDATE dbo.SecuritySettings SET Require2FAForAdmins = CASE WHEN @SettingValue = 'true' THEN 1 ELSE 0 END, UpdatedAt = GETUTCDATE();
    ELSE IF @SettingKey = 'require_2fa_vendors'
      UPDATE dbo.SecuritySettings SET Require2FAForVendors = CASE WHEN @SettingValue = 'true' THEN 1 ELSE 0 END, UpdatedAt = GETUTCDATE();
    ELSE IF @SettingKey = 'session_timeout_minutes'
      UPDATE dbo.SecuritySettings SET SessionTimeout = CAST(@SettingValue AS INT), UpdatedAt = GETUTCDATE();
    ELSE IF @SettingKey = 'failed_login_lockout'
      UPDATE dbo.SecuritySettings SET FailedLoginLockout = CAST(@SettingValue AS INT), UpdatedAt = GETUTCDATE();
END
GO
