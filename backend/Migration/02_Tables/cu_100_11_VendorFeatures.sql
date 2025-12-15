/*
    Migration Script: Create Table [VendorFeatures]
    Phase: 100 - Tables
    Script: cu_100_11_dbo.VendorFeatures.sql
    Description: Creates the [dbo].[VendorFeatures] table
    
    Execution Order: 11
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorFeatures]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorFeatures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorFeatures](
	[FeatureID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryID] [int] NULL,
	[FeatureName] [nvarchar](100) NOT NULL,
	[FeatureDescription] [nvarchar](500) NULL,
	[FeatureIcon] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[FeatureID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorFeatures] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorFeatures] already exists. Skipping.';
END
GO
