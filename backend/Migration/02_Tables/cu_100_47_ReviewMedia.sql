/*
    Migration Script: Create Table [ReviewMedia]
    Phase: 100 - Tables
    Script: cu_100_47_dbo.ReviewMedia.sql
    Description: Creates the [vendors].[ReviewMedia] table
    
    Execution Order: 47
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[ReviewMedia]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[ReviewMedia]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[ReviewMedia](
	[MediaID] [int] IDENTITY(1,1) NOT NULL,
	[ReviewID] [int] NULL,
	[ImageURL] [nvarchar](255) NOT NULL,
	[DisplayOrder] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[MediaID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[ReviewMedia] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[ReviewMedia] already exists. Skipping.';
END
GO
