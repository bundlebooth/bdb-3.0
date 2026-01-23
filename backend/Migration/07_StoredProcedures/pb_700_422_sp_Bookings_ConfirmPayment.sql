/*
    Migration Script: Create Stored Procedure [bookings].[sp_ConfirmBookingPayment]
    Description: Confirms payment for a booking
    
    Execution Order: 709
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_ConfirmBookingPayment]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_ConfirmBookingPayment]'))
    DROP PROCEDURE [bookings].[sp_ConfirmBookingPayment];
GO

CREATE PROCEDURE [bookings].[sp_ConfirmBookingPayment]
    @BookingID INT,
    @PaymentIntentID NVARCHAR(100) = NULL,
    @Amount DECIMAL(10,2) = NULL,
    @DepositOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @VendorProfileID INT;
    
    -- Get VendorProfileID before update
    SELECT @VendorProfileID = VendorProfileID FROM bookings.Bookings WHERE BookingID = @BookingID;
    
    UPDATE bookings.Bookings
    SET Status = 'paid',
        StripePaymentIntentID = COALESCE(@PaymentIntentID, StripePaymentIntentID),
        TotalAmount = COALESCE(@Amount, TotalAmount),
        DepositPaid = CASE WHEN @DepositOnly = 1 THEN 1 ELSE DepositPaid END,
        FullAmountPaid = CASE WHEN @DepositOnly = 0 THEN 1 ELSE FullAmountPaid END,
        ConfirmedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID
      AND Status IN ('approved', 'confirmed', 'accepted');
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('Booking not found or not in approved status', 16, 1);
        RETURN;
    END
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'paid', NULL, 'Payment confirmed', GETDATE());
    
    -- Refresh vendor stats (TotalBookings, etc.)
    IF @VendorProfileID IS NOT NULL
        EXEC vendors.sp_RefreshVendorStats @VendorProfileID = @VendorProfileID;
    
    SELECT @BookingID AS BookingID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_ConfirmBookingPayment] created successfully.';
GO
