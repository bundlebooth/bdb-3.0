/*
    Migration Script: Create Table [ServiceAddOns]
    Phase: 100 - Tables
    Script: cu_100_41_dbo.ServiceAddOns.sql
    Description: Creates the [vendors].[ServiceAddOns] table
    
    Execution Order: 41
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[ServiceAddOns]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[ServiceAddOns]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[ServiceAddOns](
	[AddOnID] [int] IDENTITY(1,1) NOT NULL,
	[ServiceID] [int] NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Price] [decimal](10, 2) NOT NULL,
	[IsActive] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[AddOnID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[ServiceAddOns] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[ServiceAddOns] already exists. Skipping.';
END
GO
