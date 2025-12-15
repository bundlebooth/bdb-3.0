/*
    Migration Script: Create Table [ServiceImages]
    Phase: 100 - Tables
    Script: cu_100_40_dbo.ServiceImages.sql
    Description: Creates the [dbo].[ServiceImages] table
    
    Execution Order: 40
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[ServiceImages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ServiceImages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ServiceImages](
	[ImageID] [int] IDENTITY(1,1) NOT NULL,
	[ServiceID] [int] NULL,
	[ImageURL] [nvarchar](255) NOT NULL,
	[IsPrimary] [bit] NULL,
	[DisplayOrder] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[ImageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[ServiceImages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[ServiceImages] already exists. Skipping.';
END
GO
