CREATE TABLE [dbo].[SupportTicketMessages] (
    [MessageID]   INT            IDENTITY (1, 1) NOT NULL,
    [TicketID]    INT            NOT NULL,
    [SenderID]    INT            NULL,
    [SenderType]  NVARCHAR (20)  NOT NULL,
    [Message]     NVARCHAR (MAX) NOT NULL,
    [Attachments] NVARCHAR (MAX) NULL,
    [IsInternal]  BIT            DEFAULT ((0)) NULL,
    [CreatedAt]   DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([MessageID] ASC),
    FOREIGN KEY ([SenderID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([TicketID]) REFERENCES [dbo].[SupportTickets] ([TicketID])
);


GO

CREATE NONCLUSTERED INDEX [IX_SupportTicketMessages_TicketID]
    ON [dbo].[SupportTicketMessages]([TicketID] ASC);


GO

