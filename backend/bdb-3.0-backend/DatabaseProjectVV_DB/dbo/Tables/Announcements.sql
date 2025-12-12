CREATE TABLE [dbo].[Announcements] (
    [AnnouncementID] INT            IDENTITY (1, 1) NOT NULL,
    [Title]          NVARCHAR (200) NOT NULL,
    [Content]        NVARCHAR (MAX) NOT NULL,
    [Type]           NVARCHAR (50)  DEFAULT ('info') NULL,
    [Icon]           NVARCHAR (50)  NULL,
    [LinkURL]        NVARCHAR (500) NULL,
    [LinkText]       NVARCHAR (100) NULL,
    [DisplayType]    NVARCHAR (50)  DEFAULT ('banner') NULL,
    [TargetAudience] NVARCHAR (50)  DEFAULT ('all') NULL,
    [StartDate]      DATETIME2 (7)  NULL,
    [EndDate]        DATETIME2 (7)  NULL,
    [IsActive]       BIT            DEFAULT ((1)) NULL,
    [IsDismissible]  BIT            DEFAULT ((1)) NULL,
    [DisplayOrder]   INT            DEFAULT ((0)) NULL,
    [ViewCount]      INT            DEFAULT ((0)) NULL,
    [DismissCount]   INT            DEFAULT ((0)) NULL,
    [CreatedAt]      DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [UpdatedAt]      DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [CreatedBy]      INT            NULL,
    PRIMARY KEY CLUSTERED ([AnnouncementID] ASC),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

