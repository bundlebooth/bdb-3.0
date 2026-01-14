/*
    Migration Script: Create Stored Procedure [bookings].[sp_CancelRequest]
    Description: Client cancels a booking request
    
    Execution Order: 703
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_CancelRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CancelRequest]'))
    DROP PROCEDURE [bookings].[sp_CancelRequest];
GO

CREATE PROCEDURE [bookings].[sp_CancelRequest]
    @RequestID INT,
    @UserID INT,
    @Status NVARCHAR(50) = 'cancelled',
    @RespondedAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FoundUserID INT;
    
    SELECT @FoundUserID = UserID
    FROM bookings.Bookings
    WHERE BookingID = @RequestID 
      AND UserID = @UserID
      AND Status IN ('pending', 'approved');
    
    IF @FoundUserID IS NULL
    BEGIN
        SELECT NULL AS UserID;
        RETURN;
    END
    
    UPDATE bookings.Bookings
    SET Status = @Status,
        CancelledBy = 'client',
        CancelledAt = GETDATE(),
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @RequestID;
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@RequestID, @Status, @UserID, 'Client cancelled booking', GETDATE());
    
    SELECT @FoundUserID AS UserID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_CancelRequest] created successfully.';
GO
