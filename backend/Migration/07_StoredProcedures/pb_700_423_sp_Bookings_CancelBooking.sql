/*
    Migration Script: Create Stored Procedure [bookings].[sp_CancelBooking]
    Description: Cancels a booking (by client, vendor, or admin)
    
    Execution Order: 710
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_CancelBooking]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CancelBooking]'))
    DROP PROCEDURE [bookings].[sp_CancelBooking];
GO

CREATE PROCEDURE [bookings].[sp_CancelBooking]
    @BookingID INT,
    @CancelledBy NVARCHAR(20),
    @CancelledByUserID INT = NULL,
    @CancellationReason NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings
    SET Status = 'cancelled',
        CancelledBy = @CancelledBy,
        CancellationReason = @CancellationReason,
        CancelledAt = GETDATE(),
        CancellationDate = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID
      AND Status NOT IN ('cancelled', 'completed', 'declined');
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Booking not found or cannot be cancelled', 16, 1);
        RETURN;
    END
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'cancelled', @CancelledByUserID, 
            'Cancelled by ' + @CancelledBy + COALESCE(': ' + @CancellationReason, ''), 
            GETDATE());
    
    SELECT @BookingID AS BookingID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_CancelBooking] created successfully.';
GO
