/*
    Stored Procedure: admin.sp_MarkEmailFailed
    Description: Marks a queued email as failed with retry logic
*/
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_MarkEmailFailed'))
    DROP PROCEDURE admin.sp_MarkEmailFailed
GO

CREATE PROCEDURE admin.sp_MarkEmailFailed
    @QueueID INT,
    @ErrorMessage NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CurrentAttempts INT;
    SELECT @CurrentAttempts = AttemptCount FROM admin.EmailQueue WHERE QueueID = @QueueID;
    
    UPDATE admin.EmailQueue
    SET 
        Status = CASE WHEN @CurrentAttempts >= 2 THEN 'failed' ELSE 'pending' END,
        AttemptCount = AttemptCount + 1,
        LastAttemptAt = GETDATE(),
        ErrorMessage = @ErrorMessage,
        ScheduledAt = CASE WHEN @CurrentAttempts < 2 THEN DATEADD(MINUTE, POWER(2, @CurrentAttempts + 1) * 5, GETDATE()) ELSE ScheduledAt END,
        UpdatedAt = GETDATE()
    WHERE QueueID = @QueueID;
END
GO
