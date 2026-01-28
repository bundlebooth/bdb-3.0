/*
    Migration Script: Create Table [Cultures]
    Phase: 100 - Tables
    Script: pb_100_89_Cultures.sql
    Description: Creates the [admin].[Cultures] lookup table (admin-managed reference data)
    
    Execution Order: 89
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[Cultures]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Cultures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Cultures](
        [CultureID] [int] IDENTITY(1,1) NOT NULL,
        [CultureKey] [nvarchar](50) NOT NULL,
        [CultureName] [nvarchar](100) NOT NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [CultureID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [UQ_Cultures_Key] UNIQUE NONCLUSTERED ([CultureKey])
    );
    PRINT 'Table [admin].[Cultures] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Cultures] already exists. Skipping.';
END
GO
