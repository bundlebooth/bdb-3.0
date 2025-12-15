/*
    Migration Script: Create Table [Favorites]
    Phase: 100 - Tables
    Script: cu_100_45_dbo.Favorites.sql
    Description: Creates the [dbo].[Favorites] table
    
    Execution Order: 45
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[Favorites]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Favorites]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Favorites](
	[FavoriteID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[FavoriteID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[Favorites] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[Favorites] already exists. Skipping.';
END
GO
