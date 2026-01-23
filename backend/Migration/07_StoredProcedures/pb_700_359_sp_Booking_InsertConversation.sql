-- =============================================
-- Stored Procedure: bookings.sp_InsertConversation
-- Description: Creates a new conversation or returns existing one
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertConversation]'))
    DROP PROCEDURE [bookings].[sp_InsertConversation];
GO

CREATE PROCEDURE [bookings].[sp_InsertConversation]
    @UserID INT,
    @VendorProfileID INT,
    @Subject NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if conversation already exists
    DECLARE @ExistingConversationID INT;
    SELECT @ExistingConversationID = ConversationID 
    FROM messages.Conversations 
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
    
    IF @ExistingConversationID IS NOT NULL
    BEGIN
        -- Return existing conversation
        SELECT @ExistingConversationID AS ConversationID;
        RETURN;
    END
    
    -- Create new conversation
    INSERT INTO messages.Conversations (UserID, VendorProfileID, Subject, CreatedAt)
    OUTPUT INSERTED.ConversationID
    VALUES (@UserID, @VendorProfileID, @Subject, GETDATE());
END
GO


