-- =============================================
-- Stored Procedure: sp_Messages_CreateConversationDirect
-- Description: Creates a new conversation directly (without stored procedure)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_CreateConversationDirect]'))
    DROP PROCEDURE [dbo].[sp_Messages_CreateConversationDirect];
GO

CREATE PROCEDURE [dbo].[sp_Messages_CreateConversationDirect]
    @UserID INT,
    @VendorProfileID INT,
    @Subject NVARCHAR(255) = 'New Inquiry'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Conversations (UserID, VendorProfileID, Subject, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.ConversationID
    VALUES (@UserID, @VendorProfileID, @Subject, GETDATE(), GETDATE());
END
GO
