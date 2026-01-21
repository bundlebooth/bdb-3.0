-- =============================================
-- Stored Procedure: admin.sp_CreateSupportTicket
-- Description: Creates a new support ticket
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CreateSupportTicket]'))
    DROP PROCEDURE [admin].[sp_CreateSupportTicket];
GO

CREATE PROCEDURE [admin].[sp_CreateSupportTicket]
    @UserID INT = NULL,
    @UserEmail NVARCHAR(255) = NULL,
    @UserName NVARCHAR(100) = NULL,
    @Subject NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(50) = 'general',
    @Priority NVARCHAR(20) = 'medium',
    @Source NVARCHAR(50) = 'chat',
    @ConversationID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Generate ticket number (TKT- + 8 random alphanumeric chars)
    DECLARE @TicketNumber NVARCHAR(20);
    SET @TicketNumber = 'TKT-' + UPPER(SUBSTRING(CONVERT(VARCHAR(36), NEWID()), 1, 8));
    
    INSERT INTO admin.SupportTickets (TicketNumber, UserID, UserEmail, UserName, Subject, Description, Category, Priority, Status, Source, ConversationID, CreatedAt, UpdatedAt)
    VALUES (@TicketNumber, @UserID, @UserEmail, @UserName, @Subject, @Description, @Category, @Priority, 'open', @Source, @ConversationID, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() as TicketID, @TicketNumber as TicketNumber;
END
GO

