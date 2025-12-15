/*
    Migration Script: Create Table [PredefinedServices]
    Phase: 100 - Tables
    Script: cu_100_09_dbo.PredefinedServices.sql
    Description: Creates the [dbo].[PredefinedServices] table
    
    Execution Order: 9
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[PredefinedServices]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PredefinedServices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PredefinedServices](
	[PredefinedServiceID] [int] IDENTITY(1,1) NOT NULL,
	[Category] [nvarchar](50) NOT NULL,
	[ServiceName] [nvarchar](100) NOT NULL,
	[ServiceDescription] [nvarchar](max) NULL,
	[DefaultDurationMinutes] [int] NULL,
	[IsActive] [bit] NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[PricingModel] [nvarchar](20) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[PredefinedServiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[PredefinedServices] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[PredefinedServices] already exists. Skipping.';
END
GO
