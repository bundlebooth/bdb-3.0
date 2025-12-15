/*
    Migration Script: Create Table [CommissionSettings]
    Phase: 100 - Tables
    Script: cu_100_03_dbo.CommissionSettings.sql
    Description: Creates the [dbo].[CommissionSettings] table
    
    Execution Order: 3
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[CommissionSettings]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CommissionSettings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CommissionSettings](
	[SettingID] [int] IDENTITY(1,1) NOT NULL,
	[SettingKey] [nvarchar](100) NOT NULL,
	[SettingValue] [nvarchar](500) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[SettingType] [nvarchar](50) NULL,
	[MinValue] [decimal](10, 2) NULL,
	[MaxValue] [decimal](10, 2) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[SettingID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[CommissionSettings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[CommissionSettings] already exists. Skipping.';
END
GO
