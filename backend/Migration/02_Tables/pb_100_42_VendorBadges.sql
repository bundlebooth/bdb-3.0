/*
    Migration Script: Create Table [VendorBadges]
    Phase: 100 - Tables
    Description: Creates the [vendors].[VendorBadges] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorBadges]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorBadges]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorBadges](
	[BadgeID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[BadgeType] [nvarchar](50) NOT NULL,
	[BadgeName] [nvarchar](100) NULL,
	[Year] [int] NULL,
	[ImageURL] [nvarchar](500) NULL,
	[Description] [nvarchar](500) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF__VendorBad__IsAct__6D823440] DEFAULT ((1)),
	[CreatedAt] [datetime] NOT NULL CONSTRAINT [DF__VendorBad__Creat__6C8E1007] DEFAULT (getdate()),
	[UpdatedAt] [datetime] NOT NULL CONSTRAINT [DF__VendorBad__Updat__6B99EBCE] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[BadgeID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorBadges] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorBadges] already exists. Skipping.';
END
GO
