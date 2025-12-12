CREATE TABLE [dbo].[VendorFeatures] (
    [FeatureID]          INT            IDENTITY (1, 1) NOT NULL,
    [CategoryID]         INT            NULL,
    [FeatureName]        NVARCHAR (100) NOT NULL,
    [FeatureDescription] NVARCHAR (500) NULL,
    [FeatureIcon]        NVARCHAR (50)  NULL,
    [DisplayOrder]       INT            DEFAULT ((0)) NULL,
    [IsActive]           BIT            DEFAULT ((1)) NULL,
    [CreatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FeatureID] ASC),
    FOREIGN KEY ([CategoryID]) REFERENCES [dbo].[VendorFeatureCategories] ([CategoryID]),
    CONSTRAINT [UC_CategoryFeature] UNIQUE NONCLUSTERED ([CategoryID] ASC, [FeatureName] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorFeatures_CategoryID]
    ON [dbo].[VendorFeatures]([CategoryID] ASC);


GO

