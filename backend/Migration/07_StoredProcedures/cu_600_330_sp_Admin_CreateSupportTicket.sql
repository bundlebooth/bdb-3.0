-- =============================================
-- Stored Procedure: sp_Admin_CreateSupportTicket
-- Description: Creates a new support ticket
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_CreateSupportTicket]'))
    DROP PROCEDURE [dbo].[sp_Admin_CreateSupportTicket];
GO

CREATE PROCEDURE [dbo].[sp_Admin_CreateSupportTicket]
    @TicketNumber NVARCHAR(50),
    @UserID INT = NULL,
    @UserEmail NVARCHAR(255),
    @UserName NVARCHAR(255),
    @Subject NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(50) = 'general',
    @Priority NVARCHAR(50) = 'medium',
    @Source NVARCHAR(50) = 'chat',
    @ConversationID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SupportTickets (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Source, ConversationID)
    OUTPUT INSERTED.TicketID, INSERTED.TicketNumber
    VALUES (@TicketNumber, @UserID, @UserEmail, @UserName, @Subject, @Description, @Category, @Priority, @Source, @ConversationID);
END
GO
