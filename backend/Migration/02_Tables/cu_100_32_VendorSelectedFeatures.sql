/*
    Migration Script: Create Table [VendorSelectedFeatures]
    Phase: 100 - Tables
    Script: cu_100_32_dbo.VendorSelectedFeatures.sql
    Description: Creates the [dbo].[VendorSelectedFeatures] table
    
    Execution Order: 32
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorSelectedFeatures]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorSelectedFeatures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorSelectedFeatures](
	[VendorFeatureSelectionID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[FeatureID] [int] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorFeatureSelectionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorSelectedFeatures] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorSelectedFeatures] already exists. Skipping.';
END
GO
