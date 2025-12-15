/*
    Migration Script: Create Table [BookingExpenses]
    Phase: 100 - Tables
    Script: cu_100_56_dbo.BookingExpenses.sql
    Description: Creates the [dbo].[BookingExpenses] table
    
    Execution Order: 56
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[BookingExpenses]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BookingExpenses]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[BookingExpenses](
	[BookingExpenseID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NOT NULL,
	[VendorProfileID] [int] NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Amount] [decimal](10, 2) NOT NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[BookingExpenseID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[BookingExpenses] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[BookingExpenses] already exists. Skipping.';
END
GO
