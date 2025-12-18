/*
    Migration Script: Create Table [VendorSocialMedia]
    Phase: 100 - Tables
    Script: cu_100_29_dbo.VendorSocialMedia.sql
    Description: Creates the [vendors].[VendorSocialMedia] table
    
    Execution Order: 29
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorSocialMedia]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorSocialMedia]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorSocialMedia](
	[SocialID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Platform] [nvarchar](50) NOT NULL,
	[URL] [nvarchar](255) NOT NULL,
	[DisplayOrder] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[SocialID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorSocialMedia] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorSocialMedia] already exists. Skipping.';
END
GO
