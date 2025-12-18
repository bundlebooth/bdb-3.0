-- =============================================
-- Stored Procedure: messages.sp_CreateConversationDirect
-- Description: Creates a new conversation directly (without stored procedure)
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_CreateConversationDirect]'))
    DROP PROCEDURE [messages].[sp_CreateConversationDirect];
GO

CREATE PROCEDURE [messages].[sp_CreateConversationDirect]
    @UserID INT,
    @VendorProfileID INT,
    @Subject NVARCHAR(255) = 'New Inquiry'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO messages.Conversations (UserID, VendorProfileID, Subject, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.ConversationID
    VALUES (@UserID, @VendorProfileID, @Subject, GETDATE(), GETDATE());
END
GO


