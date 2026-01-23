/*
    Migration Script: Create Table [VendorServiceAreas]
    Phase: 100 - Tables
    Description: Creates the [vendors].[VendorServiceAreas] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorServiceAreas]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorServiceAreas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorServiceAreas](
	[VendorServiceAreaID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[GooglePlaceID] [nvarchar](100) NOT NULL,
	[CityName] [nvarchar](100) NOT NULL,
	[State/Province] [nvarchar](100) NOT NULL,
	[Country] [nvarchar](100) NOT NULL,
	[Latitude] [decimal](9, 6) NULL,
	[Longitude] [decimal](9, 6) NULL,
	[ServiceRadius] [decimal](10, 2) NULL CONSTRAINT [DF__VendorSer__Servi__444B1483] DEFAULT ((25.0)),
	[IsActive] [bit] NOT NULL CONSTRAINT [DF__VendorSer__IsAct__4727812E] DEFAULT ((1)),
	[FormattedAddress] [nvarchar](255) NULL,
	[BoundsNortheastLat] [decimal](9, 6) NULL,
	[BoundsNortheastLng] [decimal](9, 6) NULL,
	[BoundsSouthwestLat] [decimal](9, 6) NULL,
	[BoundsSouthwestLng] [decimal](9, 6) NULL,
	[PlaceType] [nvarchar](50) NULL,
	[PostalCode] [nvarchar](20) NULL,
	[TravelCost] [decimal](10, 2) NULL,
	[MinimumBookingAmount] [decimal](10, 2) NULL,
	[CreatedDate] [datetime] NOT NULL CONSTRAINT [DF__VendorSer__Creat__46335CF5] DEFAULT (getdate()),
	[LastModifiedDate] [datetime] NOT NULL CONSTRAINT [DF__VendorSer__LastM__453F38BC] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[VendorServiceAreaID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorServiceAreas] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorServiceAreas] already exists. Skipping.';
END
GO
