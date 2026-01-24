-- ============================================================
-- Create Support Ticket
-- ============================================================
IF OBJECT_ID('admin.sp_CreateSupportTicket', 'P') IS NOT NULL
    DROP PROCEDURE admin.sp_CreateSupportTicket;
GO

CREATE PROCEDURE admin.sp_CreateSupportTicket
    @TicketNumber NVARCHAR(50),
    @UserID INT = NULL,
    @UserEmail NVARCHAR(255) = NULL,
    @UserName NVARCHAR(255) = NULL,
    @Subject NVARCHAR(500),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(50) = 'general',
    @Priority NVARCHAR(20) = 'medium',
    @Source NVARCHAR(50) = 'widget',
    @ConversationID INT = NULL,
    @Attachments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO admin.SupportTickets 
        (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Status, Source, ConversationID, Attachments, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.TicketID
    VALUES 
        (@TicketNumber, @UserID, @UserEmail, @UserName, @Subject, @Description, @Category, @Priority, 'open', @Source, @ConversationID, @Attachments, GETDATE(), GETDATE());
END
GO
