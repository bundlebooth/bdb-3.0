/*
    Migration Script: Create Table [AdminNotifications]
    Phase: 100 - Tables
    Script: pb_100_92_AdminNotifications.sql
    Description: Creates the [admin].[AdminNotifications] table for admin alerts on flagged content
    Schema: admin
    
    Execution Order: 92
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[AdminNotifications]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[AdminNotifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[AdminNotifications](
        [NotificationID] [int] IDENTITY(1,1) NOT NULL,
        [NotificationType] [varchar](50) NOT NULL, -- 'chat_violation', 'account_locked', 'review_flagged', 'urgent'
        [Priority] [int] NOT NULL CONSTRAINT DF_AdminNotifications_Priority DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
        [Title] [nvarchar](200) NOT NULL,
        [Message] [nvarchar](max) NOT NULL,
        [RelatedUserID] [int] NULL,
        [RelatedViolationID] [int] NULL,
        [RelatedMessageID] [int] NULL,
        [RelatedConversationID] [int] NULL,
        [ActionRequired] [bit] NOT NULL CONSTRAINT DF_AdminNotifications_ActionRequired DEFAULT 1,
        [ActionUrl] [nvarchar](500) NULL, -- Deep link to the relevant admin section
        [IsRead] [bit] NOT NULL CONSTRAINT DF_AdminNotifications_IsRead DEFAULT 0,
        [ReadByAdminID] [int] NULL,
        [ReadAt] [datetime] NULL,
        [IsResolved] [bit] NOT NULL CONSTRAINT DF_AdminNotifications_IsResolved DEFAULT 0,
        [ResolvedByAdminID] [int] NULL,
        [ResolvedAt] [datetime] NULL,
        [ResolutionNotes] [nvarchar](max) NULL,
        [CreatedAt] [datetime] NOT NULL CONSTRAINT DF_AdminNotifications_CreatedAt DEFAULT GETDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [NotificationID] ASC
    ) WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_AdminNotifications_IsRead ON [admin].[AdminNotifications]([IsRead]) WHERE IsRead = 0;
    CREATE NONCLUSTERED INDEX IX_AdminNotifications_Priority ON [admin].[AdminNotifications]([Priority] DESC, [CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX IX_AdminNotifications_NotificationType ON [admin].[AdminNotifications]([NotificationType]);
    CREATE NONCLUSTERED INDEX IX_AdminNotifications_CreatedAt ON [admin].[AdminNotifications]([CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX IX_AdminNotifications_RelatedUserID ON [admin].[AdminNotifications]([RelatedUserID]) WHERE RelatedUserID IS NOT NULL;

    PRINT 'Table [admin].[AdminNotifications] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[AdminNotifications] already exists. Skipping.';
END
GO
