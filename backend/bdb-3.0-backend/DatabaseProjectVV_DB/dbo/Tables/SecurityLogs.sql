CREATE TABLE [dbo].[SecurityLogs] (
    [LogID]        INT            IDENTITY (1, 1) NOT NULL,
    [UserID]       INT            NULL,
    [Email]        NVARCHAR (255) NULL,
    [Action]       NVARCHAR (50)  NOT NULL,
    [ActionStatus] NVARCHAR (20)  DEFAULT ('Success') NOT NULL,
    [IPAddress]    NVARCHAR (50)  NULL,
    [UserAgent]    NVARCHAR (500) NULL,
    [Location]     NVARCHAR (100) NULL,
    [Device]       NVARCHAR (100) NULL,
    [Details]      NVARCHAR (MAX) NULL,
    [CreatedAt]    DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([LogID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_SecurityLogs_CreatedAt]
    ON [dbo].[SecurityLogs]([CreatedAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_SecurityLogs_UserID]
    ON [dbo].[SecurityLogs]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SecurityLogs_Action]
    ON [dbo].[SecurityLogs]([Action] ASC);


GO

