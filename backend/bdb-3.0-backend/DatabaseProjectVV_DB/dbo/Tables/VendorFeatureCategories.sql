CREATE TABLE [dbo].[VendorFeatureCategories] (
    [CategoryID]                 INT            IDENTITY (1, 1) NOT NULL,
    [CategoryName]               NVARCHAR (100) NOT NULL,
    [CategoryIcon]               NVARCHAR (50)  NULL,
    [DisplayOrder]               INT            DEFAULT ((0)) NULL,
    [IsActive]                   BIT            DEFAULT ((1)) NULL,
    [CreatedAt]                  DATETIME       DEFAULT (getdate()) NULL,
    [ApplicableVendorCategories] NVARCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([CategoryID] ASC),
    UNIQUE NONCLUSTERED ([CategoryName] ASC)
);


GO

