/*
    Migration Script: Create Table [UserLockHistory]
    Phase: 100 - Tables
    Script: pb_100_91_UserLockHistory.sql
    Description: Creates the [admin].[UserLockHistory] table for tracking account lock reasons and history
    Schema: admin
    
    Execution Order: 91
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[UserLockHistory]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[UserLockHistory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[UserLockHistory](
        [LockHistoryID] [int] IDENTITY(1,1) NOT NULL,
        [UserID] [int] NOT NULL,
        [LockType] [varchar](50) NOT NULL, -- 'chat_violation', 'failed_login', 'admin_manual', 'suspicious_activity'
        [LockReason] [nvarchar](500) NOT NULL,
        [ViolationCount] [int] NOT NULL CONSTRAINT DF_UserLockHistory_ViolationCount DEFAULT 0,
        [RelatedViolationIDs] [nvarchar](500) NULL, -- Comma-separated list of ViolationIDs that triggered this lock
        [LockedByAdminID] [int] NULL, -- NULL if system-triggered
        [LockedAt] [datetime] NOT NULL CONSTRAINT DF_UserLockHistory_LockedAt DEFAULT GETDATE(),
        [LockDuration] [int] NULL, -- Duration in minutes, NULL = permanent until manual unlock
        [LockExpiresAt] [datetime] NULL,
        [IsActive] [bit] NOT NULL CONSTRAINT DF_UserLockHistory_IsActive DEFAULT 1,
        [UnlockedAt] [datetime] NULL,
        [UnlockedByAdminID] [int] NULL,
        [UnlockReason] [nvarchar](500) NULL,
        [EmailSent] [bit] NOT NULL CONSTRAINT DF_UserLockHistory_EmailSent DEFAULT 0,
        [EmailSentAt] [datetime] NULL,
    PRIMARY KEY CLUSTERED 
    (
        [LockHistoryID] ASC
    ) WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );

    -- Create indexes for performance
    CREATE NONCLUSTERED INDEX IX_UserLockHistory_UserID ON [admin].[UserLockHistory]([UserID]);
    CREATE NONCLUSTERED INDEX IX_UserLockHistory_IsActive ON [admin].[UserLockHistory]([IsActive]) WHERE IsActive = 1;
    CREATE NONCLUSTERED INDEX IX_UserLockHistory_LockType ON [admin].[UserLockHistory]([LockType]);
    CREATE NONCLUSTERED INDEX IX_UserLockHistory_LockedAt ON [admin].[UserLockHistory]([LockedAt] DESC);

    PRINT 'Table [admin].[UserLockHistory] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[UserLockHistory] already exists. Skipping.';
END
GO
