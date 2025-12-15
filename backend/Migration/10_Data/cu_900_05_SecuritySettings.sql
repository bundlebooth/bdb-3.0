/*
    Migration Script: Data - [SecuritySettings]
    Phase: 900 - Data
    Script: cu_900_05_dbo.SecuritySettings.sql
    Description: Inserts data into [dbo].[SecuritySettings]
    
    Execution Order: 5
    Record Count: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[SecuritySettings]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[SecuritySettings])
BEGIN
    SET IDENTITY_INSERT [dbo].[SecuritySettings] ON;

    INSERT [dbo].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (1, N'require_2fa_admins', N'false', NULL, 1, CAST(N'2025-12-12T01:04:56.673' AS DateTime), NULL);
    INSERT [dbo].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (2, N'require_2fa_vendors', N'false', NULL, 1, CAST(N'2025-12-12T01:04:56.703' AS DateTime), NULL);
    INSERT [dbo].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (3, N'session_timeout_minutes', N'60', NULL, 1, CAST(N'2025-12-12T01:04:56.737' AS DateTime), NULL);
    INSERT [dbo].[SecuritySettings] ([SettingID], [SettingKey], [SettingValue], [Description], [IsActive], [UpdatedAt], [UpdatedBy]) VALUES (4, N'failed_login_lockout', N'5', NULL, 1, CAST(N'2025-12-12T01:04:56.767' AS DateTime), NULL);

    SET IDENTITY_INSERT [dbo].[SecuritySettings] OFF;

    PRINT 'Inserted 4 records into [dbo].[SecuritySettings].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[SecuritySettings] already contains data. Skipping.';
END
GO
