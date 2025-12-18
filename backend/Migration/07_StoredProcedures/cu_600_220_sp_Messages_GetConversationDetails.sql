-- =============================================
-- Stored Procedure: sp_Messages_GetConversationDetails
-- Description: Gets conversation details by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_GetConversationDetails]'))
    DROP PROCEDURE [dbo].[sp_Messages_GetConversationDetails];
GO

CREATE PROCEDURE [dbo].[sp_Messages_GetConversationDetails]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID, VendorProfileID FROM Conversations WHERE ConversationID = @ConversationID;
END
GO
