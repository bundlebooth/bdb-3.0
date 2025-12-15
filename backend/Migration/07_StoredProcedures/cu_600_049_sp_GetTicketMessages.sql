/*
    Migration Script: Create Stored Procedure [sp_GetTicketMessages]
    Phase: 600 - Stored Procedures
    Script: cu_600_049_dbo.sp_GetTicketMessages.sql
    Description: Creates the [dbo].[sp_GetTicketMessages] stored procedure
    
    Execution Order: 49
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetTicketMessages]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetTicketMessages]'))
    DROP PROCEDURE [dbo].[sp_GetTicketMessages];
GO

CREATE   PROCEDURE [dbo].[sp_GetTicketMessages]
    @TicketID INT,
    @IncludeInternal BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.MessageID,
        m.TicketID,
        m.SenderID,
        u.Name AS SenderName,
        m.SenderType,
        m.Message,
        m.Attachments,
        m.IsInternal,
        m.CreatedAt
    FROM SupportTicketMessages m
    LEFT JOIN Users u ON m.SenderID = u.UserID
    WHERE m.TicketID = @TicketID
        AND (@IncludeInternal = 1 OR m.IsInternal = 0)
    ORDER BY m.CreatedAt ASC;
END;
GO

PRINT 'Stored procedure [dbo].[sp_GetTicketMessages] created successfully.';
GO
