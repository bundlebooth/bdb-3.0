/*
    Migration Script: Create Table [Reviews]
    Phase: 100 - Tables
    Script: cu_100_46_dbo.Reviews.sql
    Description: Creates the [vendors].[Reviews] table
    
    Execution Order: 46
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[Reviews]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Reviews]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Reviews](
	[ReviewID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[BookingID] [int] NULL,
	[Rating] [tinyint] NOT NULL,
	[Title] [nvarchar](100) NULL,
	[Comment] [nvarchar](max) NULL,
	[Response] [nvarchar](max) NULL,
	[ResponseDate] [datetime] NULL,
	[IsAnonymous] [bit] NULL,
	[IsFeatured] [bit] NULL,
	[IsApproved] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[IsFlagged] [bit] NULL,
	[FlagReason] [nvarchar](255) NULL,
	[AdminNotes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[ReviewID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[Reviews] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[Reviews] already exists. Skipping.';
END
GO
