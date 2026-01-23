/*
    Migration Script: Data - [SecuritySettings]
    Phase: 900 - Data
    Description: Inserts default data into [admin].[SecuritySettings]
    
    Execution Order: 5
    Record Count: 4
    
    Note: admin.SecuritySettings is for platform-wide admin settings (2FA, lockout, etc.)
          users.SecuritySettings is for user-level settings (deactivation preferences, etc.)
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[SecuritySettings]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[SecuritySettings])
BEGIN
    SET IDENTITY_INSERT [admin].[SecuritySettings] ON;

    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (1, N'require_2fa_admins', N'false', N'Require 2FA for all admin users', 1, GETUTCDATE(), NULL);
    
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (2, N'require_2fa_vendors', N'false', N'Require 2FA for all vendor users', 1, GETUTCDATE(), NULL);
    
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (3, N'session_timeout_minutes', N'60', N'Session timeout in minutes', 1, GETUTCDATE(), NULL);
    
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (4, N'failed_login_lockout', N'5', N'Number of failed login attempts before lockout', 1, GETUTCDATE(), NULL);
    
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (5, N'require_2fa_users', N'false', N'Require 2FA for all regular users (clients)', 1, GETUTCDATE(), NULL);
    
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) 
    VALUES (6, N'lock_duration_minutes', N'30', N'Duration in minutes to lock account after failed attempts', 1, GETUTCDATE(), NULL);

    SET IDENTITY_INSERT [admin].[SecuritySettings] OFF;

    PRINT 'Inserted 6 records into [admin].[SecuritySettings].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[SecuritySettings] already contains data. Skipping.';
END
GO
