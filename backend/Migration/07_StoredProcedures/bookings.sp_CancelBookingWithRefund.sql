-- Cancel a booking and record cancellation details
CREATE OR ALTER PROCEDURE bookings.sp_CancelBookingWithRefund
    @BookingID INT,
    @CancelledBy NVARCHAR(20), -- 'client', 'vendor', 'admin'
    @CancelledByUserID INT = NULL,
    @CancellationReason NVARCHAR(MAX) = NULL,
    @RefundAmount DECIMAL(10,2) = NULL,
    @RefundPercent DECIMAL(5,2) = NULL,
    @ApplicationFeeRetained DECIMAL(10,2) = NULL,
    @PolicyID INT = NULL,
    @HoursBeforeEvent INT = NULL,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewStatus NVARCHAR(50);
    
    -- Set status based on who cancelled
    SET @NewStatus = CASE 
        WHEN @CancelledBy = 'client' THEN 'cancelled_by_client'
        WHEN @CancelledBy = 'vendor' THEN 'cancelled_by_vendor'
        WHEN @CancelledBy = 'admin' THEN 'cancelled_by_admin'
        ELSE 'cancelled'
    END;
    
    -- Update booking status
    UPDATE bookings.Bookings
    SET Status = @NewStatus,
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    -- Insert cancellation record
    INSERT INTO bookings.BookingCancellations (
        BookingID, CancelledBy, CancelledByUserID, CancellationReason,
        RefundAmount, RefundPercent, ApplicationFeeRetained,
        PolicyID, HoursBeforeEvent, AdminNotes, RefundStatus
    )
    OUTPUT INSERTED.CancellationID
    VALUES (
        @BookingID, @CancelledBy, @CancelledByUserID, @CancellationReason,
        @RefundAmount, @RefundPercent, @ApplicationFeeRetained,
        @PolicyID, @HoursBeforeEvent, @AdminNotes,
        CASE WHEN @RefundAmount > 0 THEN 'pending' ELSE 'none' END
    );
END
GO
