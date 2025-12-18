/*
    Migration Script: Create Table [Services]
    Phase: 100 - Tables
    Script: cu_100_36_dbo.Services.sql
    Description: Creates the [vendors].[Services] table
    
    Execution Order: 36
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[Services]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Services]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Services](
	[ServiceID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryID] [int] NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[DurationMinutes] [int] NULL,
	[MinDuration] [int] NULL,
	[MaxAttendees] [int] NULL,
	[IsActive] [bit] NULL,
	[RequiresDeposit] [bit] NULL,
	[DepositPercentage] [decimal](5, 2) NULL,
	[CancellationPolicy] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[ServiceType] [nvarchar](20) NULL,
	[VendorProfileID] [int] NULL,
	[LinkedPredefinedServiceID] [int] NULL,
	[BaseDurationMinutes] [int] NULL,
	[BaseRate] [decimal](10, 2) NULL,
	[OvertimeRatePerHour] [decimal](10, 2) NULL,
	[MinimumBookingFee] [decimal](10, 2) NULL,
	[FixedPricingType] [nvarchar](20) NULL,
	[FixedPrice] [decimal](10, 2) NULL,
	[PricePerPerson] [decimal](10, 2) NULL,
	[MinimumAttendees] [int] NULL,
	[MaximumAttendees] [int] NULL,
	[PricingModel] [nvarchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[ServiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[Services] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[Services] already exists. Skipping.';
END
GO
