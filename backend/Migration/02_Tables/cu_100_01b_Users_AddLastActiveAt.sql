/*
    Migration Script: Add LastActiveAt column to Users table
    Phase: 100 - Tables
    Script: cu_100_01b_Users_AddLastActiveAt.sql
    Description: Adds LastActiveAt column to track user online status
    Schema: users
    
    Execution Order: 1b (after Users table creation)
*/

SET NOCOUNT ON;
GO

PRINT 'Adding LastActiveAt column to [users].[Users]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[users].[Users]') AND name = 'LastActiveAt')
BEGIN
    ALTER TABLE [users].[Users]
    ADD [LastActiveAt] [datetime] NULL;
    
    PRINT 'Column [LastActiveAt] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [LastActiveAt] already exists. Skipping.';
END
GO

-- Create index for efficient online status queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_LastActiveAt' AND object_id = OBJECT_ID(N'[users].[Users]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Users_LastActiveAt] 
    ON [users].[Users] ([LastActiveAt] DESC)
    WHERE [LastActiveAt] IS NOT NULL;
    
    PRINT 'Index [IX_Users_LastActiveAt] created successfully.';
END
GO
