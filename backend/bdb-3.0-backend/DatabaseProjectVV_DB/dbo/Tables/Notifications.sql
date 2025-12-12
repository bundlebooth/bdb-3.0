CREATE TABLE [dbo].[Notifications] (
    [NotificationID] INT            IDENTITY (1, 1) NOT NULL,
    [UserID]         INT            NULL,
    [Title]          NVARCHAR (200) NOT NULL,
    [Message]        NVARCHAR (MAX) NOT NULL,
    [Type]           NVARCHAR (50)  DEFAULT ('general') NULL,
    [IsRead]         BIT            DEFAULT ((0)) NULL,
    [ReadAt]         DATETIME       NULL,
    [RelatedID]      INT            NULL,
    [RelatedType]    NVARCHAR (50)  NULL,
    [ActionURL]      NVARCHAR (255) NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

