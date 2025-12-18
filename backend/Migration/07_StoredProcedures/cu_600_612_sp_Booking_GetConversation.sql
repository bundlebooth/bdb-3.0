-- =============================================
-- Stored Procedure: sp_Booking_GetConversation
-- Description: Gets conversation for user/vendor pair
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetConversation]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetConversation];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetConversation]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 ConversationID FROM Conversations 
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END
GO
