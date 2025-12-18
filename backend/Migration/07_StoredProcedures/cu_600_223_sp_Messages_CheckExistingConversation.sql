-- =============================================
-- Stored Procedure: sp_Messages_CheckExistingConversation
-- Description: Checks if a conversation exists between user and vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_CheckExistingConversation]'))
    DROP PROCEDURE [dbo].[sp_Messages_CheckExistingConversation];
GO

CREATE PROCEDURE [dbo].[sp_Messages_CheckExistingConversation]
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 ConversationID 
    FROM Conversations 
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END
GO
