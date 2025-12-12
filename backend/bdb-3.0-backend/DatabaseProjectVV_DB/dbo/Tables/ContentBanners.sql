CREATE TABLE [dbo].[ContentBanners] (
    [BannerID]        INT            IDENTITY (1, 1) NOT NULL,
    [Title]           NVARCHAR (200) NOT NULL,
    [Subtitle]        NVARCHAR (500) NULL,
    [ImageURL]        NVARCHAR (500) NULL,
    [LinkURL]         NVARCHAR (500) NULL,
    [LinkText]        NVARCHAR (100) NULL,
    [BackgroundColor] NVARCHAR (20)  NULL,
    [TextColor]       NVARCHAR (20)  NULL,
    [Position]        NVARCHAR (50)  DEFAULT ('hero') NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [StartDate]       DATETIME2 (7)  NULL,
    [EndDate]         DATETIME2 (7)  NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [UpdatedAt]       DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [CreatedBy]       INT            NULL,
    PRIMARY KEY CLUSTERED ([BannerID] ASC),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

