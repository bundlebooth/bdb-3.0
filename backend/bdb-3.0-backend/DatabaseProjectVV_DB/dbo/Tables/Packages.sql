CREATE TABLE [dbo].[Packages] (
    [PackageID]       INT             IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT             NULL,
    [Name]            NVARCHAR (100)  NOT NULL,
    [Description]     NVARCHAR (MAX)  NULL,
    [Price]           DECIMAL (10, 2) NOT NULL,
    [DurationMinutes] INT             NULL,
    [MaxGuests]       INT             NULL,
    [WhatsIncluded]   NVARCHAR (MAX)  NULL,
    [IsActive]        BIT             DEFAULT ((1)) NULL,
    [DisplayOrder]    INT             DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PackageID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

