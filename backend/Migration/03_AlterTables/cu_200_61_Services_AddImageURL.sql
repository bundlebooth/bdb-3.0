/*
    Migration Script: Add ImageURL column to Services table
    Phase: 200 - Alter Tables
    Script: cu_200_61_Services_AddImageURL.sql
    Description: Adds ImageURL column to the [vendors].[Services] table
    
    Execution Order: 61
*/

SET NOCOUNT ON;
GO

PRINT 'Adding ImageURL column to [vendors].[Services]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Services]') AND name = 'ImageURL')
BEGIN
    ALTER TABLE [vendors].[Services]
    ADD [ImageURL] NVARCHAR(500) NULL;
    PRINT 'Column ImageURL added to [vendors].[Services] successfully.';
END
ELSE
BEGIN
    PRINT 'Column ImageURL already exists in [vendors].[Services]. Skipping.';
END
GO
