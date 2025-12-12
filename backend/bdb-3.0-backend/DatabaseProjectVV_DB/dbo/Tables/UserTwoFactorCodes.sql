CREATE TABLE [dbo].[UserTwoFactorCodes] (
    [CodeID]    INT            IDENTITY (1, 1) NOT NULL,
    [UserID]    INT            NOT NULL,
    [CodeHash]  NVARCHAR (255) NOT NULL,
    [Purpose]   NVARCHAR (50)  NOT NULL,
    [ExpiresAt] DATETIME       NOT NULL,
    [CreatedAt] DATETIME       DEFAULT (getdate()) NOT NULL,
    [Attempts]  TINYINT        DEFAULT ((0)) NOT NULL,
    [IsUsed]    BIT            DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([CodeID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_UserTwoFactorCodes_UserID]
    ON [dbo].[UserTwoFactorCodes]([UserID] ASC);


GO

