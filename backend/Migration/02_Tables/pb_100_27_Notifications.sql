/*
    Migration Script: Create Table [Notifications]
    Phase: 100 - Tables
    Script: cu_100_18_dbo.Notifications.sql
    Description: Creates the [notifications].[Notifications] table
    
    Execution Order: 18
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [notifications].[Notifications]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[notifications].[Notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [notifications].[Notifications](
	[NotificationID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Title] [nvarchar](200) NOT NULL,
	[Message] [nvarchar](max) NOT NULL,
	[Type] [nvarchar](50) NULL,
	[IconType] [nvarchar](100) NULL,
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
    PRINT 'Table [notifications].[Notifications] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [notifications].[Notifications] already exists. Skipping.';
END
GO
