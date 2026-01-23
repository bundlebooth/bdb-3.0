/*
    Migration Script: Create Table [Packages]
    Phase: 100 - Tables
    Description: Creates the [vendors].[Packages] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[Packages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Packages](
	[PackageID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[PackageName] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[SalePrice] [decimal](10, 2) NULL,
	[PriceType] [nvarchar](50) NOT NULL CONSTRAINT [DF__Packages__PriceT__50E5F592] DEFAULT ('fixed'),
	[ImageURL] [nvarchar](500) NULL,
	[FinePrint] [nvarchar](max) NULL,
	[IncludedServices] [nvarchar](max) NULL,
	[IsActive] [bit] NOT NULL CONSTRAINT [DF__Packages__IsActi__4FF1D159] DEFAULT ((1)),
	[CreatedAt] [datetime] NOT NULL CONSTRAINT [DF__Packages__Create__51DA19CB] DEFAULT (getdate()),
	[UpdatedAt] [datetime] NOT NULL CONSTRAINT [DF__Packages__Update__4EFDAD20] DEFAULT (getdate()),
	[Duration] [decimal](5, 2) NULL,
	[DurationMinutes] [int] NULL,
	[BaseRate] [decimal](10, 2) NULL,
	[OvertimeRate] [decimal](10, 2) NULL,
	[FixedPrice] [decimal](10, 2) NULL,
	[PricePerPerson] [decimal](10, 2) NULL,
	[MinAttendees] [int] NULL,
	[MaxAttendees] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[PackageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[Packages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[Packages] already exists. Skipping.';
END
GO
