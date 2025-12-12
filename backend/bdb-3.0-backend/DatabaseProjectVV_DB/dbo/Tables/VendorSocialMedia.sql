CREATE TABLE [dbo].[VendorSocialMedia] (
    [SocialID]        INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Platform]        NVARCHAR (50)  NOT NULL,
    [URL]             NVARCHAR (255) NOT NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([SocialID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

