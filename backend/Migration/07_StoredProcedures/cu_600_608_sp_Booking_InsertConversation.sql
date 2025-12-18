-- =============================================
-- Stored Procedure: sp_Booking_InsertConversation
-- Description: Creates a new conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_InsertConversation]'))
    DROP PROCEDURE [dbo].[sp_Booking_InsertConversation];
GO

CREATE PROCEDURE [dbo].[sp_Booking_InsertConversation]
    @UserID INT,
    @VendorProfileID INT,
    @Subject NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt)
    OUTPUT INSERTED.ConversationID
    VALUES (@UserID, @VendorProfileID, @Subject, GETDATE());
END
GO
