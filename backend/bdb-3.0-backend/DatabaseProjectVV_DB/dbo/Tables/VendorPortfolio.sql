CREATE TABLE [dbo].[VendorPortfolio] (
    [PortfolioID]     INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Title]           NVARCHAR (100) NOT NULL,
    [Description]     NVARCHAR (MAX) NULL,
    [ImageURL]        NVARCHAR (255) NOT NULL,
    [ProjectDate]     DATE           NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PortfolioID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

