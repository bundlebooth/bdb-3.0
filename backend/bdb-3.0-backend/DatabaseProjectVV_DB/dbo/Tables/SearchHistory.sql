CREATE TABLE [dbo].[SearchHistory] (
    [SearchID]   INT            IDENTITY (1, 1) NOT NULL,
    [UserID]     INT            NULL,
    [SearchTerm] NVARCHAR (255) NULL,
    [Category]   NVARCHAR (50)  NULL,
    [Location]   NVARCHAR (255) NULL,
    [Filters]    NVARCHAR (MAX) NULL,
    [Timestamp]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SearchID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

