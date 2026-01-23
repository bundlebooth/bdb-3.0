/*
    Stored Procedure: admin.sp_GetPendingEmails
    Description: Gets pending emails from queue ready to send
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_GetPendingEmails'))
    DROP PROCEDURE admin.sp_GetPendingEmails
GO

CREATE PROCEDURE admin.sp_GetPendingEmails
    @BatchSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @EmailsToProcess TABLE (QueueID INT);
    
    INSERT INTO @EmailsToProcess (QueueID)
    SELECT TOP (@BatchSize) QueueID
    FROM admin.EmailQueue
    WHERE Status = 'pending' AND ScheduledAt <= GETDATE()
    ORDER BY Priority ASC, ScheduledAt ASC;
    
    UPDATE admin.EmailQueue
    SET Status = 'processing', UpdatedAt = GETDATE()
    WHERE QueueID IN (SELECT QueueID FROM @EmailsToProcess);
    
    SELECT 
        eq.QueueID,
        eq.TemplateKey,
        eq.RecipientEmail,
        eq.RecipientName,
        eq.Variables,
        eq.UserID,
        eq.BookingID,
        eq.EmailCategory,
        eq.Metadata,
        eq.AttemptCount
    FROM admin.EmailQueue eq
    WHERE eq.QueueID IN (SELECT QueueID FROM @EmailsToProcess);
END
GO
