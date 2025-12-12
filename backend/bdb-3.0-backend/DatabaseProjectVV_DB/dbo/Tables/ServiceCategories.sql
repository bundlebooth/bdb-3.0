CREATE TABLE [dbo].[ServiceCategories] (
    [CategoryID]      INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Name]            NVARCHAR (100) NOT NULL,
    [Description]     NVARCHAR (MAX) NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CategoryID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

