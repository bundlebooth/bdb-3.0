-- =============================================
-- Stored Procedure: bookings.sp_CancelWithRefund
-- Description: Cancels a booking and records refund information
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CancelWithRefund]'))
    DROP PROCEDURE [bookings].[sp_CancelWithRefund];
GO

CREATE PROCEDURE [bookings].[sp_CancelWithRefund]
    @BookingID INT,
    @CancelledBy NVARCHAR(20),
    @CancelledByUserID INT = NULL,
    @CancellationReason NVARCHAR(MAX) = NULL,
    @RefundAmount DECIMAL(10,2) = NULL,
    @RefundPercentage DECIMAL(5,2) = NULL,
    @StripeRefundID NVARCHAR(100) = NULL,
    @PolicyApplied NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StripePaymentIntentID NVARCHAR(100);
    
    -- Get the payment intent ID
    SELECT @StripePaymentIntentID = StripePaymentIntentID 
    FROM bookings.Bookings 
    WHERE BookingID = @BookingID;
    
    -- Update booking status to cancelled
    UPDATE bookings.Bookings
    SET Status = 'cancelled',
        CancelledBy = @CancelledBy,
        CancelledByUserID = @CancelledByUserID,
        CancellationReason = @CancellationReason,
        CancellationDate = GETDATE(),
        RefundAmount = @RefundAmount,
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    -- Record the refund in BookingRefunds table
    IF @RefundAmount IS NOT NULL AND @RefundAmount > 0
    BEGIN
        INSERT INTO bookings.BookingRefunds 
            (BookingID, StripeRefundID, StripePaymentIntentID, RefundAmount, 
             CancelledBy, CancelledByUserID, RefundStatus, PolicyApplied, 
             RefundPercentage, Notes, ProcessedAt)
        VALUES 
            (@BookingID, @StripeRefundID, @StripePaymentIntentID, @RefundAmount,
             @CancelledBy, @CancelledByUserID, 'completed', @PolicyApplied,
             @RefundPercentage, @CancellationReason, GETDATE());
    END
    
    SELECT 
        b.BookingID,
        b.Status,
        b.CancelledBy,
        b.CancellationDate,
        b.RefundAmount,
        b.StripePaymentIntentID
    FROM bookings.Bookings b
    WHERE b.BookingID = @BookingID;
END
GO

