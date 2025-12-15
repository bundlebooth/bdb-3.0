/*
    Migration Script: Create Table [VendorSelectedServices]
    Phase: 100 - Tables
    Script: cu_100_37_dbo.VendorSelectedServices.sql
    Description: Creates the [dbo].[VendorSelectedServices] table
    
    Execution Order: 37
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorSelectedServices]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorSelectedServices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorSelectedServices](
	[VendorSelectedServiceID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[PredefinedServiceID] [int] NULL,
	[VendorPrice] [decimal](10, 2) NOT NULL,
	[VendorDurationMinutes] [int] NULL,
	[VendorDescription] [nvarchar](max) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[ImageURL] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorSelectedServiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorSelectedServices] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorSelectedServices] already exists. Skipping.';
END
GO
