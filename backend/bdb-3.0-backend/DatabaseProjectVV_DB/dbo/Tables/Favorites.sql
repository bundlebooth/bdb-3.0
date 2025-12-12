CREATE TABLE [dbo].[Favorites] (
    [FavoriteID]      INT      IDENTITY (1, 1) NOT NULL,
    [UserID]          INT      NULL,
    [VendorProfileID] INT      NULL,
    [CreatedAt]       DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FavoriteID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]),
    CONSTRAINT [UC_Favorite] UNIQUE NONCLUSTERED ([UserID] ASC, [VendorProfileID] ASC)
);


GO

