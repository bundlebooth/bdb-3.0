/*
    Migration Script: Add ConversationType column to Conversations table
    Phase: 250 - Alter Tables
    Script: cu_250_01_Conversations_AddConversationType.sql
    Description: Adds ConversationType column to support different conversation types (vendor, support)
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Adding ConversationType column to [messages].[Conversations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[messages].[Conversations]') AND name = 'ConversationType')
BEGIN
    ALTER TABLE [messages].[Conversations]
    ADD [ConversationType] NVARCHAR(50) NULL;
    
    PRINT 'Column ConversationType added successfully.';
    
    -- Update existing conversations to have 'vendor' type
    UPDATE [messages].[Conversations] SET ConversationType = 'vendor' WHERE ConversationType IS NULL;
    
    PRINT 'Existing conversations updated to vendor type.';
END
ELSE
BEGIN
    PRINT 'Column ConversationType already exists. Skipping.';
END
GO

PRINT 'Done adding ConversationType column.';
GO
