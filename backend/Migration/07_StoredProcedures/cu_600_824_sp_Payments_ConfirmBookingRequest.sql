-- =============================================
-- Payments - Confirm Booking Request
-- Created: Payment verification fix
-- Description: Confirms a booking request by updating the status
--              based on UserID and VendorProfileID match
-- =============================================
IF OBJECT_ID('payments.sp_ConfirmBookingRequest', 'P') IS NOT NULL
    DROP PROCEDURE payments.sp_ConfirmBookingRequest;
GO

CREATE PROCEDURE payments.sp_ConfirmBookingRequest
    @UserID INT,
    @VendorProfileID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the most recent pending booking for this user/vendor combination
    -- Use a subquery to find the most recent booking
    UPDATE bookings.Bookings 
    SET Status = 'confirmed', 
        ConfirmedAt = GETDATE(), 
        StripePaymentIntentID = @StripePaymentIntentID,
        UpdatedAt = GETDATE(),
        FullAmountPaid = 1
    WHERE BookingID = (
        SELECT TOP(1) BookingID
        FROM bookings.Bookings
        WHERE UserID = @UserID 
          AND VendorProfileID = @VendorProfileID
          AND Status IN ('pending', 'accepted', 'approved')
        ORDER BY CreatedAt DESC
    );
    
    -- Return the number of rows affected
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
