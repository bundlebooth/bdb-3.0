CREATE TABLE [dbo].[VendorCategories] (
    [VendorCategoryID] INT           IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]  INT           NULL,
    [Category]         NVARCHAR (50) NOT NULL,
    PRIMARY KEY CLUSTERED ([VendorCategoryID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]),
    CONSTRAINT [UC_VendorCategory] UNIQUE NONCLUSTERED ([VendorProfileID] ASC, [Category] ASC)
);


GO

