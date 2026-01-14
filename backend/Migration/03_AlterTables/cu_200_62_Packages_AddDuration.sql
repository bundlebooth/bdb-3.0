/*
    Migration Script: Add Duration column to Packages table
    Phase: 200 - Alter Tables
    Script: cu_200_62_Packages_AddDuration.sql
    Description: Adds Duration column to the [vendors].[Packages] table
    
    Execution Order: 62
*/

SET NOCOUNT ON;
GO

PRINT 'Adding Duration column to [vendors].[Packages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'Duration')
BEGIN
    ALTER TABLE [vendors].[Packages]
    ADD [Duration] DECIMAL(5, 2) NULL;
    PRINT 'Column Duration added to [vendors].[Packages] successfully.';
END
ELSE
BEGIN
    PRINT 'Column Duration already exists in [vendors].[Packages]. Skipping.';
END
GO
