/*
    Migration Script: Create Table [VendorBusinessHours]
    Phase: 100 - Tables
    Script: cu_100_23_dbo.VendorBusinessHours.sql
    Description: Creates the [vendors].[VendorBusinessHours] table
    
    Execution Order: 23
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorBusinessHours]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorBusinessHours]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorBusinessHours](
	[HoursID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[DayOfWeek] [tinyint] NULL,
	[OpenTime] [time](7) NULL,
	[CloseTime] [time](7) NULL,
	[IsAvailable] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[Timezone] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[HoursID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorBusinessHours] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorBusinessHours] already exists. Skipping.';
END
GO
