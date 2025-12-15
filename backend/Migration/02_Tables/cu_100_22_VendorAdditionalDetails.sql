/*
    Migration Script: Create Table [VendorAdditionalDetails]
    Phase: 100 - Tables
    Script: cu_100_22_dbo.VendorAdditionalDetails.sql
    Description: Creates the [dbo].[VendorAdditionalDetails] table
    
    Execution Order: 22
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorAdditionalDetails]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorAdditionalDetails]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorAdditionalDetails](
	[DetailID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[QuestionID] [int] NOT NULL,
	[Answer] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[DetailID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorAdditionalDetails] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorAdditionalDetails] already exists. Skipping.';
END
GO
