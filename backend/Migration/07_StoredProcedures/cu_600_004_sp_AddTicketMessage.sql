/*
    Migration Script: Create Stored Procedure [sp_AddTicketMessage]
    Phase: 600 - Stored Procedures
    Script: cu_600_004_dbo.sp_AddTicketMessage.sql
    Description: Creates the [admin].[sp_AddTicketMessage] stored procedure
    
    Execution Order: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_AddTicketMessage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_AddTicketMessage]'))
    DROP PROCEDURE [admin].[sp_AddTicketMessage];
GO

CREATE   PROCEDURE [admin].[sp_AddTicketMessage]
    @TicketID INT,
    @SenderID INT = NULL,
    @SenderType NVARCHAR(20),
    @Message NVARCHAR(MAX),
    @Attachments NVARCHAR(MAX) = NULL,
    @IsInternal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SupportTicketMessages (TicketID, SenderID, SenderType, Message, Attachments, IsInternal)
    VALUES (@TicketID, @SenderID, @SenderType, @Message, @Attachments, @IsInternal);
    
    -- Update ticket timestamp
    UPDATE admin.SupportTickets SET UpdatedAt = GETUTCDATE() WHERE TicketID = @TicketID;
    
    SELECT SCOPE_IDENTITY() AS MessageID;
END;
GO

PRINT 'Stored procedure [admin].[sp_AddTicketMessage] created successfully.';
GO

