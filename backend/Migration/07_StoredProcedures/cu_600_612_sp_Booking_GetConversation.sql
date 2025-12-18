-- =============================================
-- Stored Procedure: bookings.sp_GetConversation
-- Description: Gets conversation for user/vendor pair
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetConversation]'))
    DROP PROCEDURE [bookings].[sp_GetConversation];
GO

CREATE PROCEDURE [bookings].[sp_GetConversation]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 ConversationID FROM messages.Conversations 
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END
GO


