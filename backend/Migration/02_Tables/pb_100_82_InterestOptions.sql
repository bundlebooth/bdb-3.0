/*
    Migration Script: Create Table [InterestOptions]
    Phase: 100 - Tables
    Script: pb_100_82_InterestOptions.sql
    Description: Creates the [users].[InterestOptions] table for predefined interest options
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[InterestOptions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[InterestOptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[InterestOptions](
        [InterestOptionID] INT IDENTITY(1,1) NOT NULL,
        [Interest] NVARCHAR(100) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL,
        [Icon] NVARCHAR(50) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_InterestOptions] PRIMARY KEY CLUSTERED ([InterestOptionID] ASC)
    );
    
    PRINT 'Table [users].[InterestOptions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[InterestOptions] already exists. Skipping.';
END
GO
