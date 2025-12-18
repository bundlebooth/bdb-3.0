/*
    Migration Script: Data - [SecuritySettings]
    Phase: 900 - Data
    Script: cu_900_05_dbo.SecuritySettings.sql
    Description: Inserts data into [admin].[SecuritySettings]
    
    Execution Order: 5
    Record Count: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[SecuritySettings]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[SecuritySettings])
BEGIN
    SET IDENTITY_INSERT [admin].[SecuritySettings] ON;

    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (1, N'require_2fa_admins', N'false', NULL, 1, CAST(N'2025-12-12T01:04:56.673' AS DateTime), NULL);
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (2, N'require_2fa_vendors', N'false', NULL, 1, CAST(N'2025-12-12T01:04:56.703' AS DateTime), NULL);
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (3, N'session_timeout_minutes', N'60', NULL, 1, CAST(N'2025-12-12T01:04:56.737' AS DateTime), NULL);
    INSERT [admin].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (4, N'failed_login_lockout', N'5', NULL, 1, CAST(N'2025-12-12T01:04:56.767' AS DateTime), NULL);

    SET IDENTITY_INSERT [admin].[SecuritySettings] OFF;

    PRINT 'Inserted 4 records into [admin].[SecuritySettings].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[SecuritySettings] already contains data. Skipping.';
END
GO
