-- =============================================
-- Stored Procedure: messages.sp_GetConversationDetails
-- Description: Gets conversation details by ID
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetConversationDetails]'))
    DROP PROCEDURE [messages].[sp_GetConversationDetails];
GO

CREATE PROCEDURE [messages].[sp_GetConversationDetails]
    @ConversationID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID, VendorProfileID FROM messages.Conversations WHERE ConversationID = @ConversationID;
END
GO


