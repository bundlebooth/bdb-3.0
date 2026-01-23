/*
    Migration Script: Create Stored Procedure [bookings].[sp_UpdateCancellationRefund]
    Description: Creates the [bookings].[sp_UpdateCancellationRefund] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_UpdateCancellationRefund]'))
    DROP PROCEDURE [bookings].[sp_UpdateCancellationRefund];
GO

-- Update cancellation with Stripe refund details
CREATE   PROCEDURE bookings.sp_UpdateCancellationRefund
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
