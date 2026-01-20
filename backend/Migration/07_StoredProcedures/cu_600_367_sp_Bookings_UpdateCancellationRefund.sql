-- Update cancellation with Stripe refund details
CREATE OR ALTER PROCEDURE bookings.sp_UpdateCancellationRefund
    @CancellationID INT = NULL,
    @BookingID INT = NULL,
    @StripeRefundID NVARCHAR(100),
    @StripeRefundStatus NVARCHAR(50),
    @RefundStatus NVARCHAR(50),
    @ProcessedByUserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @CancellationID IS NOT NULL
    BEGIN
        UPDATE bookings.BookingCancellations
        SET StripeRefundID = @StripeRefundID,
            StripeRefundStatus = @StripeRefundStatus,
            RefundStatus = @RefundStatus,
            ProcessedAt = GETDATE(),
            ProcessedByUserID = @ProcessedByUserID
        WHERE CancellationID = @CancellationID;
    END
    ELSE IF @BookingID IS NOT NULL
    BEGIN
        UPDATE bookings.BookingCancellations
        SET StripeRefundID = @StripeRefundID,
            StripeRefundStatus = @StripeRefundStatus,
            RefundStatus = @RefundStatus,
            ProcessedAt = GETDATE(),
            ProcessedByUserID = @ProcessedByUserID
        WHERE BookingID = @BookingID
          AND CancellationID = (
              SELECT MAX(CancellationID) 
              FROM bookings.BookingCancellations 
              WHERE BookingID = @BookingID
          );
    END
END
GO
