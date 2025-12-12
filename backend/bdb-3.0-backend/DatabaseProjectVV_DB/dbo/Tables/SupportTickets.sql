CREATE TABLE [dbo].[SupportTickets] (
    [TicketID]       INT            IDENTITY (1, 1) NOT NULL,
    [TicketNumber]   NVARCHAR (20)  NOT NULL,
    [UserID]         INT            NULL,
    [UserEmail]      NVARCHAR (255) NULL,
    [UserName]       NVARCHAR (100) NULL,
    [Subject]        NVARCHAR (255) NOT NULL,
    [Description]    NVARCHAR (MAX) NOT NULL,
    [Category]       NVARCHAR (50)  DEFAULT ('general') NULL,
    [Priority]       NVARCHAR (20)  DEFAULT ('medium') NULL,
    [Status]         NVARCHAR (20)  DEFAULT ('open') NULL,
    [AssignedTo]     INT            NULL,
    [Source]         NVARCHAR (50)  DEFAULT ('chat') NULL,
    [ConversationID] INT            NULL,
    [CreatedAt]      DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [UpdatedAt]      DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [ResolvedAt]     DATETIME2 (7)  NULL,
    [ClosedAt]       DATETIME2 (7)  NULL,
    [Attachments]    NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([TicketID] ASC),
    FOREIGN KEY ([AssignedTo]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([TicketNumber] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_SupportTickets_Status]
    ON [dbo].[SupportTickets]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SupportTickets_UserID]
    ON [dbo].[SupportTickets]([UserID] ASC);


GO

