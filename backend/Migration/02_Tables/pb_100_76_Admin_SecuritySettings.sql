/*
    Migration Script: Create Table [admin].[SecuritySettings]
    Phase: 100 - Tables
    Description: Creates the [admin].[SecuritySettings] table for platform-wide admin security settings
    Schema: admin
    
    This table stores admin-level security settings as key-value pairs.
    For user-level settings (deactivation, preferences), use users.SecuritySettings
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[SecuritySettings]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[SecuritySettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[SecuritySettings](
        [SettingID] [int] IDENTITY(1,1) NOT NULL,
        [SettingKey] [nvarchar](100) NOT NULL,
        [SettingValue] [nvarchar](500) NULL,
        [Description] [nvarchar](500) NULL,
        [IsActive] [bit] NOT NULL CONSTRAINT [DF_Admin_SecuritySettings_IsActive] DEFAULT (1),
        [UpdatedAt] [datetime] NOT NULL CONSTRAINT [DF_Admin_SecuritySettings_UpdatedAt] DEFAULT (GETUTCDATE()),
        [UpdatedBy] [int] NULL,
    PRIMARY KEY CLUSTERED 
    (
        [SettingID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [UQ_Admin_SecuritySettings_SettingKey] UNIQUE NONCLUSTERED ([SettingKey])
    );
    PRINT 'Table [admin].[SecuritySettings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[SecuritySettings] already exists. Skipping.';
END
GO
