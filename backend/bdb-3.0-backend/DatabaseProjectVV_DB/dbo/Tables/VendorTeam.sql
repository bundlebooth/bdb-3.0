CREATE TABLE [dbo].[VendorTeam] (
    [TeamID]          INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Name]            NVARCHAR (100) NOT NULL,
    [Role]            NVARCHAR (100) NULL,
    [Bio]             NVARCHAR (MAX) NULL,
    [ImageURL]        NVARCHAR (255) NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TeamID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

