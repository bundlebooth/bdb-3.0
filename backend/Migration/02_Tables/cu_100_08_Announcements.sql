/*
    Migration Script: Create Table [Announcements]
    Phase: 100 - Tables
    Script: cu_100_08_dbo.Announcements.sql
    Description: Creates the [admin].[Announcements] table
    
    Execution Order: 8
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[Announcements]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Announcements]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Announcements](
	[AnnouncementID] [int] IDENTITY(1,1) NOT NULL,
	[Title] [nvarchar](200) NOT NULL,
	[Content] [nvarchar](max) NOT NULL,
	[Type] [nvarchar](50) NULL,
	[Icon] [nvarchar](50) NULL,
	[LinkURL] [nvarchar](500) NULL,
	[LinkText] [nvarchar](100) NULL,
	[DisplayType] [nvarchar](50) NULL,
	[TargetAudience] [nvarchar](50) NULL,
	[StartDate] [datetime2](7) NULL,
	[EndDate] [datetime2](7) NULL,
	[IsActive] [bit] NULL,
	[IsDismissible] [bit] NULL,
	[DisplayOrder] [int] NULL,
	[ViewCount] [int] NULL,
	[DismissCount] [int] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[CreatedBy] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[AnnouncementID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[Announcements] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Announcements] already exists. Skipping.';
END
GO
