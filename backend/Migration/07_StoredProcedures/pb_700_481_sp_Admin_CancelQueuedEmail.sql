/*
    Stored Procedure: admin.sp_CancelQueuedEmail
    Description: Cancels a pending queued email
*/
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND OBJECT_ID = OBJECT_ID('admin.sp_CancelQueuedEmail'))
    DROP PROCEDURE admin.sp_CancelQueuedEmail
GO

CREATE PROCEDURE admin.sp_CancelQueuedEmail
    @QueueID INT,
    @CancelledBy INT = NULL,
    @CancelReason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE admin.EmailQueue
    SET 
        Status = 'cancelled',
        CancelledAt = GETDATE(),
        CancelledBy = @CancelledBy,
        CancelReason = @CancelReason,
        UpdatedAt = GETDATE()
    WHERE QueueID = @QueueID AND Status = 'pending';
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
