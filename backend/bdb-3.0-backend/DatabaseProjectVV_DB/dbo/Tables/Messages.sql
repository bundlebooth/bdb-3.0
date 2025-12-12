CREATE TABLE [dbo].[Messages] (
    [MessageID]      INT            IDENTITY (1, 1) NOT NULL,
    [ConversationID] INT            NULL,
    [SenderID]       INT            NULL,
    [Content]        NVARCHAR (MAX) NOT NULL,
    [IsRead]         BIT            DEFAULT ((0)) NULL,
    [ReadAt]         DATETIME       NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([MessageID] ASC),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([SenderID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

