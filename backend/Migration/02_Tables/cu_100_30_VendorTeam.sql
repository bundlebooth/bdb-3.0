/*
    Migration Script: Create Table [VendorTeam]
    Phase: 100 - Tables
    Script: cu_100_30_dbo.VendorTeam.sql
    Description: Creates the [dbo].[VendorTeam] table
    
    Execution Order: 30
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorTeam]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorTeam]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorTeam](
	[TeamID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Role] [nvarchar](100) NULL,
	[Bio] [nvarchar](max) NULL,
	[ImageURL] [nvarchar](255) NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[TeamID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorTeam] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorTeam] already exists. Skipping.';
END
GO
