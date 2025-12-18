/*
    Migration Script: Create Table [SecuritySettings]
    Phase: 100 - Tables
    Script: cu_100_06_dbo.SecuritySettings.sql
    Description: Creates the [admin].[SecuritySettings] table
    
    Execution Order: 6
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
	[SettingValue] [nvarchar](500) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[IsActive] [bit] NULL,
	[UpdatedAt] [datetime] NULL,
	[UpdatedBy] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[SettingID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[SecuritySettings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[SecuritySettings] already exists. Skipping.';
END
GO
