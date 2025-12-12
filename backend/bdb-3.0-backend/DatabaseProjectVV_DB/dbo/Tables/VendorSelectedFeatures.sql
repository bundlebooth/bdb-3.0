CREATE TABLE [dbo].[VendorSelectedFeatures] (
    [VendorFeatureSelectionID] INT      IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]          INT      NULL,
    [FeatureID]                INT      NULL,
    [CreatedAt]                DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([VendorFeatureSelectionID] ASC),
    FOREIGN KEY ([FeatureID]) REFERENCES [dbo].[VendorFeatures] ([FeatureID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]) ON DELETE CASCADE,
    CONSTRAINT [UC_VendorFeature] UNIQUE NONCLUSTERED ([VendorProfileID] ASC, [FeatureID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorSelectedFeatures_FeatureID]
    ON [dbo].[VendorSelectedFeatures]([FeatureID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorSelectedFeatures_VendorProfileID]
    ON [dbo].[VendorSelectedFeatures]([VendorProfileID] ASC);


GO

