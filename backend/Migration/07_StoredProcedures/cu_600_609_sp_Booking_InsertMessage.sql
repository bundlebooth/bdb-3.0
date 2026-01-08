-- =============================================
-- Stored Procedure: bookings.sp_InsertMessage
-- Description: Inserts a message into a conversation
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertMessage]'))
    DROP PROCEDURE [bookings].[sp_InsertMessage];
GO

CREATE PROCEDURE [bookings].[sp_InsertMessage]
    @ConversationID INT,
    @SenderID INT,
    @Content NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO messages.Messages (ConversationID, SenderID, Content, CreatedAt)
    VALUES (@ConversationID, @SenderID, @Content, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END
GO

