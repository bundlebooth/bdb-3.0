/*
    Migration Script: Create Table [Notifications]
    Phase: 100 - Tables
    Script: cu_100_18_dbo.Notifications.sql
    Description: Creates the [dbo].[Notifications] table
    
    Execution Order: 18
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[Notifications]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Notifications](
	[NotificationID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Title] [nvarchar](200) NOT NULL,
	[Message] [nvarchar](max) NOT NULL,
	[Type] [nvarchar](50) NULL,
	[IsRead] [bit] NULL,
	[ReadAt] [datetime] NULL,
	[RelatedID] [int] NULL,
	[RelatedType] [nvarchar](50) NULL,
	[ActionURL] [nvarchar](255) NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[NotificationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[Notifications] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[Notifications] already exists. Skipping.';
END
GO
