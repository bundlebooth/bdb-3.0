/*
    Migration Script: Create Table [Packages]
    Phase: 100 - Tables
    Script: cu_100_35_dbo.Packages.sql
    Description: Creates the [vendors].[Packages] table
    
    Execution Order: 35
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[Packages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Packages](
	[PackageID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[DurationMinutes] [int] NULL,
	[MaxGuests] [int] NULL,
	[WhatsIncluded] [nvarchar](max) NULL,
	[IsActive] [bit] NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
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
