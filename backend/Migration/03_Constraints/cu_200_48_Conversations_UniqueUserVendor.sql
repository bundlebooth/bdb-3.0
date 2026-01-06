/*
    Migration Script: Add Unique Constraint to Conversations
    Phase: 200 - Constraints
    Script: cu_200_48_Conversations_UniqueUserVendor.sql
    Description: Adds a unique constraint on (UserID, VendorProfileID) to prevent
                 duplicate conversations between the same user and vendor.
                 Each user-vendor pair should only have ONE conversation.
    
    Execution Order: 48
*/

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Adding unique constraint to [messages].[Conversations]...';
GO

-- First check if the constraint already exists
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'UQ_Conversations_UserID_VendorProfileID' 
    AND object_id = OBJECT_ID('messages.Conversations')
)
BEGIN
    -- Create a unique filtered index (allows NULLs, unlike a unique constraint)
    -- This prevents multiple conversations for the same UserID + VendorProfileID pair
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Conversations_UserID_VendorProfileID]
    ON [messages].[Conversations] ([UserID], [VendorProfileID])
    WHERE [UserID] IS NOT NULL AND [VendorProfileID] IS NOT NULL;
    
    PRINT 'Unique index [UQ_Conversations_UserID_VendorProfileID] created successfully.';
END
ELSE
BEGIN
    PRINT 'Unique index [UQ_Conversations_UserID_VendorProfileID] already exists. Skipping.';
END
GO
