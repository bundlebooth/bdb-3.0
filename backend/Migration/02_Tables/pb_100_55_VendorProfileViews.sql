/*
    Migration Script: Create Table [VendorProfileViews]
    Phase: 100 - Tables
    Script: cu_100_33_dbo.VendorProfileViews.sql
    Description: Creates the [vendors].[VendorProfileViews] table
    
    Execution Order: 33
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorProfileViews]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfileViews]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorProfileViews](
	[ViewID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[ViewerUserID] [int] NULL,
	[ViewedAt] [datetime2](7) NOT NULL,
	[IPAddress] [varchar](45) NULL,
	[UserAgent] [varchar](500) NULL,
	[ReferrerUrl] [varchar](1000) NULL,
	[SessionID] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[ViewID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorProfileViews] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorProfileViews] already exists. Skipping.';
END
GO
