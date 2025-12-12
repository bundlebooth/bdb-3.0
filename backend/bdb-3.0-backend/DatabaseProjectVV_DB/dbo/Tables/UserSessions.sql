CREATE TABLE [dbo].[UserSessions] (
    [SessionID] INT            IDENTITY (1, 1) NOT NULL,
    [UserID]    INT            NULL,
    [Token]     NVARCHAR (255) NOT NULL,
    [IPAddress] NVARCHAR (50)  NULL,
    [UserAgent] NVARCHAR (255) NULL,
    [CreatedAt] DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt] DATETIME       NOT NULL,
    [IsActive]  BIT            DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([SessionID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

