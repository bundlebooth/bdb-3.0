/*
    Migration Script: Create Stored Procedure [sp_CreateSupportTicket]
    Phase: 600 - Stored Procedures
    Script: cu_600_020_dbo.sp_CreateSupportTicket.sql
    Description: Creates the [dbo].[sp_CreateSupportTicket] stored procedure
    
    Execution Order: 20
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_CreateSupportTicket]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateSupportTicket]'))
    DROP PROCEDURE [dbo].[sp_CreateSupportTicket];
GO

CREATE   PROCEDURE [dbo].[sp_CreateSupportTicket]
    @UserID INT = NULL,
    @UserEmail NVARCHAR(255) = NULL,
    @UserName NVARCHAR(100) = NULL,
    @Subject NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(50) = 'general',
    @Priority NVARCHAR(20) = 'medium',
    @Source NVARCHAR(50) = 'widget',
    @ConversationID INT = NULL,
    @Attachments NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TicketNumber NVARCHAR(20) = 'TKT-' + FORMAT(GETUTCDATE(), 'yyyyMMdd') + '-' + RIGHT('0000' + CAST((SELECT ISNULL(MAX(TicketID), 0) + 1 FROM SupportTickets) AS NVARCHAR), 4);
    
    INSERT INTO SupportTickets (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Source, ConversationID, Attachments)
    VALUES (@TicketNumber, @UserID, @UserEmail, @UserName, @Subject, @Description, @Category, @Priority, @Source, @ConversationID, @Attachments);
    
    DECLARE @NewTicketID INT = SCOPE_IDENTITY();
    
    -- If a conversation ID was provided, link it
    IF @ConversationID IS NOT NULL
    BEGIN
        INSERT INTO SupportConversations (TicketID, ConversationID)
        VALUES (@NewTicketID, @ConversationID);
    END
    
    SELECT @NewTicketID AS TicketID, @TicketNumber AS TicketNumber;
END;
GO

PRINT 'Stored procedure [dbo].[sp_CreateSupportTicket] created successfully.';
GO
