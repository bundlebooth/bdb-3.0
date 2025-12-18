/*
    Migration Script: Create Table [SearchHistory]
    Phase: 100 - Tables
    Script: cu_100_17_dbo.SearchHistory.sql
    Description: Creates the [users].[SearchHistory] table
    
    Execution Order: 17
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[SearchHistory]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[SearchHistory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[SearchHistory](
	[SearchID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[SearchTerm] [nvarchar](255) NULL,
	[Category] [nvarchar](50) NULL,
	[Location] [nvarchar](255) NULL,
	[Filters] [nvarchar](max) NULL,
	[Timestamp] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[SearchID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[SearchHistory] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[SearchHistory] already exists. Skipping.';
END
GO
