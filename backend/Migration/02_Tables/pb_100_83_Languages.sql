/*
    Migration Script: Create Table [Languages]
    Phase: 100 - Tables
    Script: pb_100_83_Languages.sql
    Description: Creates the [admin].[Languages] table for storing available languages
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[Languages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Languages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Languages](
        [LanguageID] INT IDENTITY(1,1) NOT NULL,
        [Code] NVARCHAR(10) NOT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [NativeName] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [DisplayOrder] INT NULL DEFAULT 0,
        CONSTRAINT [PK_Languages] PRIMARY KEY CLUSTERED ([LanguageID] ASC),
        CONSTRAINT [UQ_Languages_Code] UNIQUE ([Code])
    );
    
    PRINT 'Table [admin].[Languages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Languages] already exists. Skipping.';
END
GO
