CREATE TABLE [dbo].[SupportConversations] (
    [SupportConversationID] INT           IDENTITY (1, 1) NOT NULL,
    [TicketID]              INT           NOT NULL,
    [ConversationID]        INT           NOT NULL,
    [CreatedAt]             DATETIME2 (7) DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([SupportConversationID] ASC),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([TicketID]) REFERENCES [dbo].[SupportTickets] ([TicketID])
);


GO

CREATE NONCLUSTERED INDEX [IX_SupportConversations_TicketID]
    ON [dbo].[SupportConversations]([TicketID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SupportConversations_ConversationID]
    ON [dbo].[SupportConversations]([ConversationID] ASC);


GO

