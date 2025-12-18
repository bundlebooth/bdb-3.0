-- =============================================
-- Stored Procedure: sp_Booking_InsertMessage
-- Description: Inserts a message into a conversation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_InsertMessage]'))
    DROP PROCEDURE [dbo].[sp_Booking_InsertMessage];
GO

CREATE PROCEDURE [dbo].[sp_Booking_InsertMessage]
    @ConversationID INT,
    @SenderID INT,
    @Content NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Messages (ConversationID, SenderID, Content, CreatedAt)
    VALUES (@ConversationID, @SenderID, @Content, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO
