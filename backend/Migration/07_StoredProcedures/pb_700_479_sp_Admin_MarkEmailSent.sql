/*
    Stored Procedure: admin.sp_MarkEmailSent
    Description: Marks a queued email as sent
*/
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_MarkEmailSent'))
    DROP PROCEDURE admin.sp_MarkEmailSent
GO

CREATE PROCEDURE admin.sp_MarkEmailSent
    @QueueID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE admin.EmailQueue
    SET Status = 'sent', SentAt = GETDATE(), UpdatedAt = GETDATE()
    WHERE QueueID = @QueueID;
END
GO
