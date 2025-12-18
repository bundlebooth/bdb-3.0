-- =============================================
-- Stored Procedure: bookings.sp_InsertConversation
-- Description: Creates a new conversation
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
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
    
    INSERT INTO messages.Conversations (UserID, VendorProfileID, Subject, CreatedAt)
    OUTPUT INSERTED.ConversationID
    VALUES (@UserID, @VendorProfileID, @Subject, GETDATE());
END
GO


