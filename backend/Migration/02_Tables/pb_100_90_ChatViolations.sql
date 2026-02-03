/*
    Migration Script: Create Table [ChatViolations]
    Phase: 100 - Tables
    Script: pb_100_90_ChatViolations.sql
    Description: Creates the [admin].[ChatViolations] table for tracking chat content violations
    Schema: admin
    
    Execution Order: 90
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[ChatViolations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[ChatViolations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[ChatViolations](
        [ViolationID] [int] IDENTITY(1,1) NOT NULL,
        [UserID] [int] NOT NULL,
        [MessageID] [int] NULL,
        [ConversationID] [int] NULL,
        [ViolationType] [varchar](50) NOT NULL, -- 'email', 'phone', 'profanity', 'racism', 'solicitation'
        [DetectedContent] [nvarchar](500) NULL, -- The specific content that triggered the violation
        [OriginalMessage] [nvarchar](max) NULL, -- Full original message for context
        [Severity] [int] NOT NULL CONSTRAINT DF_ChatViolations_Severity DEFAULT 1, -- 1=warning, 2=moderate, 3=severe
        [IsBlocked] [bit] NOT NULL CONSTRAINT DF_ChatViolations_IsBlocked DEFAULT 0, -- Was the message blocked from sending
        [IsReviewed] [bit] NOT NULL CONSTRAINT DF_ChatViolations_IsReviewed DEFAULT 0,
        [ReviewedByAdminID] [int] NULL,
        [ReviewedAt] [datetime] NULL,
        [ActionTaken] [varchar](50) NULL, -- 'dismissed', 'warned', 'locked', 'escalated'
        [AdminNotes] [nvarchar](max) NULL,
        [CreatedAt] [datetime] NOT NULL CONSTRAINT DF_ChatViolations_CreatedAt DEFAULT GETDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [ViolationID] ASC
    ) WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_ChatViolations_UserID ON [admin].[ChatViolations]([UserID]);
    CREATE NONCLUSTERED INDEX IX_ChatViolations_CreatedAt ON [admin].[ChatViolations]([CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX IX_ChatViolations_IsReviewed ON [admin].[ChatViolations]([IsReviewed]) WHERE IsReviewed = 0;
    CREATE NONCLUSTERED INDEX IX_ChatViolations_ViolationType ON [admin].[ChatViolations]([ViolationType]);

    PRINT 'Table [admin].[ChatViolations] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[ChatViolations] already exists. Skipping.';
END
GO
